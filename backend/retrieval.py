"""
retrieval.py v2 — HybridRetriever with all 6 enhancements wired.
"""
from __future__ import annotations
import asyncio, logging, re, threading
from typing import List, Optional
import httpx, numpy as np
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from rank_bm25 import BM25Okapi
import chromadb
from config import settings

logger = logging.getLogger(__name__)

class OllamaEmbeddingFunction(EmbeddingFunction):
    def __init__(self):
        self._url   = settings.ollama_embed_url
        self._model = settings.ollama_embed_model

    def _get_cache(self):
        if settings.redis_enabled:
            from redis_cache import get_redis_cache
            return get_redis_cache("embed")
        from cache import get_embed_cache
        return get_embed_cache()

    def _embed_one(self, client, text):
        from cache import make_cache_key
        cache = self._get_cache()
        key = make_cache_key("embed", self._model, text)
        cached = cache.get(key)
        if cached is not None:
            return cached
        for attempt in range(settings.ollama_max_retries):
            try:
                resp = client.post(self._url, json={"model": self._model, "prompt": text},
                                   timeout=settings.ollama_timeout_seconds)
                resp.raise_for_status()
                emb = resp.json()["embedding"]
                cache.set(key, emb)
                return emb
            except httpx.HTTPError:
                if attempt == settings.ollama_max_retries - 1: raise
                import time; time.sleep(settings.ollama_retry_backoff * (2 ** attempt))

    def __call__(self, input: Documents) -> Embeddings:
        with httpx.Client() as client:
            return [self._embed_one(client, t) for t in input]


class HybridRetriever:
    _NOISE = frozenset(["i","me","my","we","our","the","a","an","is","it","to","in",
                         "on","at","of","for","and","or","but","with","this","that","was"])

    def __init__(self):
        self._ef = OllamaEmbeddingFunction()
        self._client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=chromadb.config.Settings(anonymized_telemetry=False)
        )
        self.collection = self._client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self._ef,
        )
        self._lock = threading.RLock()
        self.bm25: Optional[BM25Okapi] = None
        self.corpus: List[str] = []
        self.corpus_ids: List[str] = []
        self.corpus_meta: List[dict] = []
        self._tok: List[List[str]] = []
        self._rebuild_bm25()

    def _tokenize(self, text):
        return [t for t in re.findall(r"\b[a-zA-Z]{2,}\b", text.lower()) if t not in self._NOISE]

    def _preprocess(self, q):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", q)).strip()

    def _rebuild_bm25(self):
        try:
            d = self.collection.get(include=["documents", "metadatas"])
            if not d["documents"]: return
            with self._lock:
                self.corpus      = d["documents"]
                self.corpus_ids  = d["ids"]
                self.corpus_meta = d["metadatas"] or [{} for _ in self.corpus]
                self._tok        = [self._tokenize(x) for x in self.corpus]
                self.bm25        = BM25Okapi(self._tok)
            logger.info("BM25 rebuilt — %d docs", len(self.corpus))
        except Exception: logger.exception("BM25 rebuild failed")

    def _rebuild_async(self):
        threading.Thread(target=self._rebuild_bm25, daemon=True).start()

    # ── Document management ───────────────────────────────────────────────────
    def add_documents(self, texts, ids, metadatas=None):
        existing = set(self.collection.get(ids=ids)["ids"])
        nt, ni, nm = [], [], []
        for t, i, m in zip(texts, ids, metadatas or [{} for _ in texts]):
            if i not in existing:
                nt.append(t); ni.append(i); nm.append(m)
        if nt:
            self.collection.upsert(documents=nt, ids=ni, metadatas=nm)
            self._rebuild_async()

    def delete_documents(self, ids):
        self.collection.delete(ids=ids); self._rebuild_async()

    def update_document(self, doc_id, text, metadata):
        self.collection.update(ids=[doc_id], documents=[text], metadatas=[metadata]); self._rebuild_async()

    def document_exists(self, doc_id):
        return bool(self.collection.get(ids=[doc_id])["ids"])

    # ── Search ────────────────────────────────────────────────────────────────
    def keyword_search(self, query, top_k=10):
        with self._lock:
            if not self.bm25 or not self.corpus: return []
            scores = self.bm25.get_scores(self._tokenize(query))
        results = []
        for rank, idx in enumerate(np.argsort(scores)[::-1][:top_k], 1):
            if scores[idx] > 0:
                results.append({"id": self.corpus_ids[idx], "text": self.corpus[idx],
                    "score": float(scores[idx]), "rank": rank, "method": "keyword",
                    "metadata": self.corpus_meta[idx] if idx < len(self.corpus_meta) else {}})
        try:
            from metrics import metrics; metrics.record_chunks("keyword", len(results))
        except Exception: pass
        return results

    def semantic_search(self, query, top_k=10, filter_dict=None):
        n = min(top_k, self.collection.count() or 1)
        kw = {"query_texts": [query], "n_results": n, "include": ["documents","metadatas","distances"]}
        if filter_dict: kw["where"] = filter_dict
        res = self.collection.query(**kw)
        results = []
        for rank, (did, txt, meta, dist) in enumerate(zip(
                res["ids"][0], res["documents"][0], res["metadatas"][0], res["distances"][0]), 1):
            results.append({"id": did, "text": txt,
                "score": round(max(0.0, 1.0 - float(dist)), 4),
                "rank": rank, "method": "semantic", "metadata": meta or {}})
        try:
            from metrics import metrics; metrics.record_chunks("semantic", len(results))
        except Exception: pass
        return results

    # ── Fusion ────────────────────────────────────────────────────────────────
    def reciprocal_rank_fusion(self, kw, sem):
        k, kw_w, sem_w = settings.rrf_k, settings.keyword_weight, settings.semantic_weight
        scores, cache = {}, {}
        for r in kw:
            scores[r["id"]] = scores.get(r["id"], 0.0) + kw_w / (k + r["rank"])
            cache[r["id"]] = r
        for r in sem:
            scores[r["id"]] = scores.get(r["id"], 0.0) + sem_w / (k + r["rank"])
            cache[r["id"]] = r
        fused = []
        for rank, (did, score) in enumerate(sorted(scores.items(), key=lambda x: x[1], reverse=True), 1):
            fused.append({**cache[did], "score": round(score, 6), "rank": rank, "method": "fused"})
        return fused

    # ── Re-ranking (Enhancement 1) ────────────────────────────────────────────
    def _rerank(self, query, candidates, top_n):
        from reranker import get_reranker
        reranker = get_reranker(settings.rerank_model)
        method = "neural" if reranker.is_neural else "tfidf"
        try:
            from metrics import metrics
            with metrics.time_rerank(method):
                return reranker.rerank(query, candidates, top_n)
        except Exception:
            return reranker.rerank(query, candidates, top_n)

    # ── Main pipeline ─────────────────────────────────────────────────────────
    async def retrieve(self, query, top_k=None, filter_dict=None,
                       use_hyde=None, language_result=None):
        top_k   = top_k or settings.top_k
        query   = self._preprocess(query)
        fetch_k = top_k * settings.retrieval_multiplier

        # Enhancement 4: language
        if language_result is None and settings.multilang_enabled:
            try:
                from language import get_language_processor
                language_result = await get_language_processor().process(query)
                if language_result.was_translated:
                    logger.info("Translated %s→en", language_result.detected_lang)
            except Exception as exc:
                logger.debug("Language skipped: %s", exc)

        rq = language_result.processed_text if language_result else query

        # Enhancement 2: HyDE
        sq = rq
        hyde_used = False
        if (use_hyde if use_hyde is not None else settings.hyde_enabled):
            try:
                from hyde import get_hyde
                from metrics import metrics
                with metrics.time_hyde():
                    sq = await asyncio.wait_for(get_hyde().expand(rq),
                                                timeout=settings.hyde_timeout_seconds)
                hyde_used = sq != rq
            except Exception as exc:
                logger.debug("HyDE skipped: %s", exc)

        # Parallel search
        kw_r, sem_r = await asyncio.gather(
            asyncio.to_thread(self.keyword_search,  rq,  fetch_k),
            asyncio.to_thread(self.semantic_search, sq,  fetch_k, filter_dict),
        )

        fused = self.reciprocal_rank_fusion(kw_r, sem_r)

        reranked = False
        if settings.rerank_enabled and len(fused) > 1:
            fused    = await asyncio.to_thread(self._rerank, rq, fused, top_k)
            reranked = True
        else:
            fused = fused[:top_k]

        debug = {
            "keyword_hits":       len(kw_r),
            "semantic_hits":      len(sem_r),
            "fused_hits":         len(fused),
            "keyword_top_score":  kw_r[0]["score"]  if kw_r  else 0.0,
            "semantic_top_score": sem_r[0]["score"] if sem_r else 0.0,
            "reranked":           reranked,
            "hyde_used":          hyde_used,
            "detected_lang":      getattr(language_result, "detected_lang",  "en"),
            "was_translated":     getattr(language_result, "was_translated", False),
        }
        return fused, debug