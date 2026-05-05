"""
reranker.py — Neural cross-encoder re-ranking

Enhancement 1: Neural Re-ranking
─────────────────────────────────
Replaces the TF-IDF cosine re-ranker in retrieval.py with a real
cross-encoder (cross-encoder/ms-marco-MiniLM-L-6-v2).

How it works
  The cross-encoder takes a (query, document) pair and produces a single
  relevance score — unlike bi-encoders that embed query and doc independently,
  a cross-encoder attends to both at once, giving far higher accuracy at the
  cost of being O(n) at inference time (not indexable). This is exactly right
  for re-ranking a small shortlist (top-15 from RRF) rather than the full corpus.

Accuracy impact
  On MS-MARCO, cross-encoders typically improve MRR@10 by 6-10 points over
  bi-encoder retrieval. On domain-specific data (customer complaints) the lift
  is even larger because the cross-encoder can attend to complaint-specific
  terminology that generic embeddings compress away.

Fallback
  If sentence-transformers is not installed (CPU-only VMs, first-time setup),
  the module gracefully falls back to the TF-IDF cosine scorer so the rest of
  the pipeline keeps working.

Usage (drop-in replacement for the rerank() in retrieval.py)
─────────────────────────────────────────────────────────────
    from reranker import get_reranker
    reranker = get_reranker()          # singleton, loaded once at startup
    reranked = reranker.rerank(query, candidates, top_n=5)
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


# ── Cross-Encoder Reranker ────────────────────────────────────────────────────

class CrossEncoderReranker:
    """
    Production re-ranker backed by sentence-transformers CrossEncoder.
    Model is loaded once and cached as a module-level singleton.
    """

    DEFAULT_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    def __init__(self, model_name: str = DEFAULT_MODEL) -> None:
        self.model_name = model_name
        self._model = None
        self._load()

    def _load(self) -> None:
        try:
            from sentence_transformers import CrossEncoder
            logger.info("Loading cross-encoder: %s …", self.model_name)
            self._model = CrossEncoder(
                self.model_name,
                max_length=512,
                # Device is auto-detected: CUDA > MPS > CPU
            )
            try:
                device = next(self._model.model.parameters()).device
            except Exception:
                device = "unknown"
            logger.info("Cross-encoder loaded ✓ (device=%s)", device)
        except ImportError:
            logger.warning(
                "sentence-transformers not installed — falling back to TF-IDF re-ranker. "
                "Run: pip install sentence-transformers"
            )
            self._model = None
        except Exception as exc:
            logger.error("Cross-encoder load failed: %s — using TF-IDF fallback.", exc)
            self._model = None

    @property
    def is_neural(self) -> bool:
        return self._model is not None

    def rerank(self, query: str, candidates: List[Dict], top_n: int = 5) -> List[Dict]:
        """
        Score (query, doc) pairs and return top_n by descending relevance.

        Falls back to TF-IDF cosine if the cross-encoder is unavailable.
        The RRF score is blended in (30% weight) to penalise low-quality
        retrievals even when the cross-encoder gives them a high surface score.
        """
        if not candidates:
            return candidates

        if self._model is not None:
            return self._neural_rerank(query, candidates, top_n)
        return self._tfidf_rerank(query, candidates, top_n)

    # ── Neural path ───────────────────────────────────────────────────────────

    def _neural_rerank(self, query: str, candidates: List[Dict], top_n: int) -> List[Dict]:
        pairs = [(query, c["text"][:512]) for c in candidates]
        try:
            scores = self._model.predict(pairs, show_progress_bar=False)
        except Exception as exc:
            logger.error("Cross-encoder inference failed: %s — falling back to TF-IDF.", exc)
            return self._tfidf_rerank(query, candidates, top_n)

        # Normalise logit scores to [0, 1] via sigmoid
        import math
        def sigmoid(x: float) -> float:
            return 1.0 / (1.0 + math.exp(-x))

        reranked = []
        for i, c in enumerate(candidates):
            neural_score = sigmoid(float(scores[i]))
            # Blend: 70% neural + 30% RRF (preserves retrieval signal)
            blended = 0.70 * neural_score + 0.30 * c["score"]
            reranked.append({**c, "score": round(blended, 6), "_neural_score": round(neural_score, 4)})

        reranked.sort(key=lambda x: x["score"], reverse=True)
        for rank, doc in enumerate(reranked, 1):
            doc["rank"] = rank
        return reranked[:top_n]

    # ── TF-IDF fallback ───────────────────────────────────────────────────────

    def _tfidf_rerank(self, query: str, candidates: List[Dict], top_n: int) -> List[Dict]:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        corpus = [query] + [c["text"] for c in candidates]
        try:
            vec   = TfidfVectorizer(stop_words="english", max_features=5_000)
            tfidf = vec.fit_transform(corpus)
            sims  = cosine_similarity(tfidf[0], tfidf[1:])[0]
        except ValueError:
            return candidates[:top_n]

        reranked = []
        for i, c in enumerate(candidates):
            blended = 0.40 * c["score"] + 0.60 * float(sims[i])
            reranked.append({**c, "score": round(blended, 6)})

        reranked.sort(key=lambda x: x["score"], reverse=True)
        for rank, doc in enumerate(reranked, 1):
            doc["rank"] = rank
        return reranked[:top_n]


# ── Singleton factory ─────────────────────────────────────────────────────────

_reranker: Optional[CrossEncoderReranker] = None


def get_reranker(model_name: str = CrossEncoderReranker.DEFAULT_MODEL) -> CrossEncoderReranker:
    """Return the module-level singleton, creating it on first call."""
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoderReranker(model_name)
    return _reranker