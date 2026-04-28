"""
retrieval.py — Production-grade HybridRetriever

Key improvements over v1:
  • Async-safe: blocking Ollama calls run in a thread pool via asyncio.to_thread
  • Embedding cache: avoids re-embedding the same text (SHA-256 keyed TTL cache)
  • Lazy BM25 rebuild: index rebuilt in a background thread, not on every add_documents
  • Lightweight cross-encoder re-ranking: TF-IDF cosine between query and each chunk
    (plug-in replacement for a real cross-encoder once you add sentence-transformers)
  • Metadata filtering: pass filter_dict to narrow ChromaDB results before fusion
  • Query preprocessing: lowercase, strip, remove noise tokens for better BM25 recall
  • Proper cosine distance → similarity conversion (ChromaDB HNSW returns L2 by default
    with cosine space enabled, so distance IS cosine distance ∈ [0,2])
"""

from __future__ import annotations

import asyncio
import logging
import re
import threading
from typing import Dict, List, Optional, Tuple

import httpx
import numpy as np
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import chromadb

from cache import get_embed_cache, make_cache_key
from config import settings

logger = logging.getLogger(__name__)


# ── Embedding Function ────────────────────────────────────────────────────────

class OllamaEmbeddingFunction(EmbeddingFunction):
    """
    Wraps Ollama's /api/embeddings endpoint.
    Uses a TTL cache so repeated identical texts are not re-embedded.
    """

    def __init__(
        self,
        model_name: str = settings.ollama_embed_model,
        url: str = settings.ollama_embed_url,
    ) -> None:
        self.model_name = model_name
        self.url = url
        self._cache = get_embed_cache()

    def _embed_one(self, client: httpx.Client, text: str) -> List[float]:
        cache_key = make_cache_key("embed", self.model_name, text)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        for attempt in range(settings.ollama_max_retries):
            try:
                resp = client.post(
                    self.url,
                    json={"model": self.model_name, "prompt": text},
                    timeout=settings.ollama_timeout_seconds,
                )
                resp.raise_for_status()
                embedding = resp.json()["embedding"]
                self._cache.set(cache_key, embedding)
                return embedding
            except httpx.HTTPError as exc:
                if attempt == settings.ollama_max_retries - 1:
                    raise
                wait = settings.ollama_retry_backoff * (2 ** attempt)
                logger.warning("Embedding attempt %d failed (%s). Retrying in %.1fs…", attempt + 1, exc, wait)
                import time; time.sleep(wait)

    def __call__(self, input: Documents) -> Embeddings:
        embeddings: Embeddings = []
        with httpx.Client() as client:
            for text in input:
                embeddings.append(self._embed_one(client, text))
        return embeddings


# ── Hybrid Retriever ──────────────────────────────────────────────────────────

class HybridRetriever:
    """
    Combines BM25 keyword search with dense ChromaDB vector search via
    Reciprocal Rank Fusion (RRF), with optional lightweight re-ranking.
    """

    def __init__(
        self,
        collection_name: str = settings.chroma_collection_name,
        persist_dir: str = settings.chroma_persist_dir,
    ) -> None:
        self._ef = OllamaEmbeddingFunction()
        self._client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._ef,
        )

        # BM25 state — protected by a lock for background rebuilds
        self._bm25_lock = threading.RLock()
        self.bm25: Optional[BM25Okapi] = None
        self.corpus: List[str] = []
        self.corpus_ids: List[str] = []
        self.corpus_meta: List[dict] = []
        self._tokenized_corpus: List[List[str]] = []

        self._rebuild_bm25()

    # ── Tokenization & preprocessing ──────────────────────────────────────────

    _NOISE_TOKENS = frozenset(
        ["i", "me", "my", "we", "our", "the", "a", "an", "is", "it", "to", "in",
         "on", "at", "of", "for", "and", "or", "but", "with", "this", "that", "was"]
    )

    def _tokenize(self, text: str) -> List[str]:
        tokens = re.findall(r"\b[a-zA-Z]{2,}\b", text.lower())
        return [t for t in tokens if t not in self._NOISE_TOKENS]

    def _preprocess_query(self, query: str) -> str:
        """Normalise whitespace; strip HTML artifacts."""
        query = re.sub(r"<[^>]+>", " ", query)
        return re.sub(r"\s+", " ", query).strip()

    # ── BM25 Index ────────────────────────────────────────────────────────────

    def _rebuild_bm25(self) -> None:
        """Rebuild in-memory BM25 from ChromaDB.  Safe to call in a background thread."""
        try:
            all_docs = self.collection.get(include=["documents", "metadatas"])
            if not all_docs["documents"]:
                return
            with self._bm25_lock:
                self.corpus = all_docs["documents"]
                self.corpus_ids = all_docs["ids"]
                self.corpus_meta = all_docs["metadatas"] or [{} for _ in self.corpus]
                self._tokenized_corpus = [self._tokenize(d) for d in self.corpus]
                self.bm25 = BM25Okapi(self._tokenized_corpus)
            logger.info("BM25 index rebuilt — %d documents", len(self.corpus))
        except Exception:
            logger.exception("BM25 rebuild failed")

    def _rebuild_bm25_async(self) -> None:
        """Fire-and-forget background rebuild so add_documents returns immediately."""
        t = threading.Thread(target=self._rebuild_bm25, daemon=True)
        t.start()

    # ── Document Management ───────────────────────────────────────────────────

    def add_documents(
        self,
        texts: List[str],
        ids: List[str],
        metadatas: Optional[List[dict]] = None,
    ) -> None:
        existing_ids = set(self.collection.get(ids=ids)["ids"])
        new_texts, new_ids, new_meta = [], [], []
        for t, i, m in zip(texts, ids, metadatas or [{} for _ in texts]):
            if i not in existing_ids:
                new_texts.append(t)
                new_ids.append(i)
                new_meta.append(m)

        if not new_texts:
            logger.info("add_documents: all %d documents already exist — skipped", len(ids))
            return

        self.collection.add(documents=new_texts, ids=new_ids, metadatas=new_meta)
        logger.info("Added %d new documents to ChromaDB", len(new_texts))
        self._rebuild_bm25_async()

    def delete_documents(self, ids: List[str]) -> None:
        self.collection.delete(ids=ids)
        self._rebuild_bm25_async()

    def update_document(self, doc_id: str, text: str, metadata: dict) -> None:
        self.collection.update(ids=[doc_id], documents=[text], metadatas=[metadata])
        self._rebuild_bm25_async()

    def document_exists(self, doc_id: str) -> bool:
        result = self.collection.get(ids=[doc_id])
        return bool(result["ids"])

    # ── Search Methods ────────────────────────────────────────────────────────

    def keyword_search(self, query: str, top_k: int = 10) -> List[Dict]:
        with self._bm25_lock:
            if not self.bm25 or not self.corpus:
                return []
            tokens = self._tokenize(query)
            if not tokens:
                return []
            scores = self.bm25.get_scores(tokens)

        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for rank, idx in enumerate(top_indices, 1):
            if scores[idx] > 0:
                results.append({
                    "id": self.corpus_ids[idx],
                    "text": self.corpus[idx],
                    "score": float(scores[idx]),
                    "rank": rank,
                    "method": "keyword",
                    "metadata": self.corpus_meta[idx] if idx < len(self.corpus_meta) else {},
                })
        return results

    def semantic_search(
        self,
        query: str,
        top_k: int = 10,
        filter_dict: Optional[Dict] = None,
    ) -> List[Dict]:
        kwargs: Dict = {
            "query_texts": [query],
            "n_results": min(top_k, self.collection.count() or 1),
            "include": ["documents", "metadatas", "distances"],
        }
        if filter_dict:
            kwargs["where"] = filter_dict

        results = self.collection.query(**kwargs)

        semantic_results = []
        for rank, (doc_id, text, meta, distance) in enumerate(
            zip(
                results["ids"][0],
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ),
            1,
        ):
            # ChromaDB cosine space: distance ∈ [0, 2], where 0 = identical
            similarity = max(0.0, 1.0 - distance)
            semantic_results.append({
                "id": doc_id,
                "text": text,
                "score": round(float(similarity), 4),
                "rank": rank,
                "method": "semantic",
                "metadata": meta or {},
            })
        return semantic_results

    # ── Fusion ────────────────────────────────────────────────────────────────

    def reciprocal_rank_fusion(
        self,
        keyword_results: List[Dict],
        semantic_results: List[Dict],
        k: float = settings.rrf_k,
        keyword_weight: float = settings.keyword_weight,
        semantic_weight: float = settings.semantic_weight,
    ) -> List[Dict]:
        """
        RRF score = Σ weight_i / (k + rank_i)

        Using rank positions instead of raw scores elegantly sidesteps the
        BM25 (unbounded) vs cosine ([-1,1]) scale mismatch.
        """
        scores: Dict[str, float] = {}
        doc_cache: Dict[str, Dict] = {}

        for r in keyword_results:
            scores[r["id"]] = scores.get(r["id"], 0.0) + keyword_weight / (k + r["rank"])
            doc_cache[r["id"]] = r

        for r in semantic_results:
            scores[r["id"]] = scores.get(r["id"], 0.0) + semantic_weight / (k + r["rank"])
            doc_cache[r["id"]] = r

        fused = []
        for rank, (doc_id, score) in enumerate(
            sorted(scores.items(), key=lambda x: x[1], reverse=True), 1
        ):
            entry = dict(doc_cache[doc_id])
            entry["score"] = round(score, 6)
            entry["rank"] = rank
            entry["method"] = "fused"
            fused.append(entry)
        return fused

    # ── Re-ranking ────────────────────────────────────────────────────────────

    def rerank(self, query: str, candidates: List[Dict], top_n: int = 5) -> List[Dict]:
        """
        Lightweight TF-IDF cross-attention re-ranker.

        For production, swap this body with a sentence-transformers cross-encoder:
            from sentence_transformers import CrossEncoder
            model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            scores = model.predict([(query, c["text"]) for c in candidates])

        This TF-IDF version adds measurable value vs pure RRF (no GPU needed).
        """
        if not candidates:
            return candidates

        corpus = [query] + [c["text"] for c in candidates]
        try:
            vectorizer = TfidfVectorizer(stop_words="english", max_features=5_000)
            tfidf = vectorizer.fit_transform(corpus)
            query_vec = tfidf[0]
            doc_vecs = tfidf[1:]
            sims = cosine_similarity(query_vec, doc_vecs)[0]
        except ValueError:
            # Edge case: single document or empty vocabulary
            return candidates[:top_n]

        # Blend RRF score (0.4) with cross-attention similarity (0.6)
        reranked = []
        for i, c in enumerate(candidates):
            blended = 0.4 * c["score"] + 0.6 * float(sims[i])
            reranked.append({**c, "score": round(blended, 6)})

        reranked.sort(key=lambda x: x["score"], reverse=True)
        for new_rank, doc in enumerate(reranked, 1):
            doc["rank"] = new_rank
        return reranked[:top_n]

    # ── Main Retrieval Pipeline ───────────────────────────────────────────────

    async def retrieve(
        self,
        query: str,
        top_k: int = settings.top_k,
        filter_dict: Optional[Dict] = None,
        rerank: bool = settings.rerank_enabled,
    ) -> Tuple[List[Dict], Dict]:
        """
        Full async hybrid pipeline.
        Blocking search ops are offloaded to the default thread executor.
        """
        query = self._preprocess_query(query)
        fetch_k = top_k * settings.retrieval_multiplier

        # Run both searches concurrently in thread pool
        kw_task = asyncio.to_thread(self.keyword_search, query, fetch_k)
        sem_task = asyncio.to_thread(self.semantic_search, query, fetch_k, filter_dict)
        keyword_results, semantic_results = await asyncio.gather(kw_task, sem_task)

        fused = self.reciprocal_rank_fusion(keyword_results, semantic_results)

        reranked_flag = False
        if rerank and len(fused) > 1:
            fused = await asyncio.to_thread(self.rerank, query, fused, top_k)
            reranked_flag = True
        else:
            fused = fused[:top_k]

        debug_info = {
            "keyword_hits": len(keyword_results),
            "semantic_hits": len(semantic_results),
            "fused_hits": len(fused),
            "keyword_top_score": keyword_results[0]["score"] if keyword_results else 0.0,
            "semantic_top_score": semantic_results[0]["score"] if semantic_results else 0.0,
            "reranked": reranked_flag,
        }
        return fused, debug_info