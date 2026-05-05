"""
main.py v2 — FastAPI app with all 6 enhancements integrated.

New endpoints:
  GET  /admin/few-shot-examples    list active few-shot examples
  POST /admin/refresh-prompts      trigger immediate few-shot refresh
  GET  /metrics                    Prometheus scrape (if enabled)
  GET  /cache/info                 per-cache hit/miss stats
"""
from __future__ import annotations
import asyncio, json, logging, time, uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from cache import get_query_cache
from config import settings
from feedback import FeedbackStore
from llm_engine import OllamaLLMEngine
from middleware import APIKeyMiddleware, LoggingMiddleware, RateLimitMiddleware, RequestIDMiddleware
from metrics import metrics, setup_metrics
from models import (
    BatchClassificationResponse, BatchComplaintInput, ClassificationResponse,
    ComplaintInput, DocumentUpsert, FeedbackRequest, FeedbackResponse,
    FusionDebugInfo, HealthResponse, RetrievedChunk, StatsResponse,
)
from retrieval import HybridRetriever
from seed_data import seed_database

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
logging.getLogger("chromadb").setLevel(logging.ERROR)

_start_time = time.monotonic()
_total_classifications = 0
_total_latency_ms = 0.0

retriever: HybridRetriever = None
llm_engine: OllamaLLMEngine = None
feedback_store: FeedbackStore = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever, llm_engine, feedback_store

    logger.info("Starting up…")

    # Enhancement 6: connect Redis caches
    if settings.redis_enabled:
        from redis_cache import connect_all_caches, get_redis_cache
        get_redis_cache("query"); get_redis_cache("embed")
        await connect_all_caches()
        logger.info("Redis caches connected.")

    retriever      = HybridRetriever()
    seed_database(retriever)
    llm_engine     = OllamaLLMEngine()
    feedback_store = FeedbackStore()

    # Enhancement 5: few-shot refresher
    refresher = None
    if settings.few_shot_refresh_enabled:
        from few_shot_refresh import init_refresher
        refresher = init_refresher(feedback_store, llm_engine)
        asyncio.create_task(refresher.run_background_loop())
        logger.info("Few-shot background refresher started.")

    # Enhancement 3: Prometheus metrics + document count gauge
    metrics.set_document_count(retriever.collection.count())

    logger.info("All services ready ✓")
    yield

    # Shutdown
    if settings.redis_enabled:
        from redis_cache import close_all_caches
        await close_all_caches()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="ResolveAI — Hybrid RAG Complaint Classifier",
    version="2.0.0",
    lifespan=lifespan,
)

# Enhancement 3: Prometheus (must be set up before middleware)
setup_metrics(app)

app.add_middleware(APIKeyMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_cache():
    if settings.redis_enabled:
        from redis_cache import get_redis_cache
        return get_redis_cache("query")
    return get_query_cache()

def _chunks_to_model(chunks):
    return [RetrievedChunk(id=c["id"], text=c["text"], source="knowledge_base",
        score=c["score"], rank=c["rank"], retrieval_method=c["method"],
        metadata=c.get("metadata", {})) for c in chunks]

async def _classify_one(complaint: ComplaintInput) -> ClassificationResponse:
    global _total_classifications, _total_latency_ms
    start = time.perf_counter()
    complaint_id = f"COMP-{uuid.uuid4().hex[:8].upper()}"

    cache = _get_cache()
    from cache import make_cache_key
    ck = make_cache_key("full_classify", complaint.text)
    if settings.cache_enabled:
        cached = cache.get(ck)
        if cached:
            cached.cached = True
            return cached

    # Enhancement 4: language processing
    language_result = None
    if settings.multilang_enabled:
        try:
            from language import get_language_processor
            language_result = await get_language_processor().process(complaint.text)
        except Exception as exc:
            logger.debug("Language processing error: %s", exc)

    chunks, debug_info = await retriever.retrieve(
        complaint.text, language_result=language_result
    )
    if not chunks:
        raise HTTPException(404, "No relevant context found.")

    classification = await llm_engine.classify(complaint.text, chunks)
    ms = round((time.perf_counter() - start) * 1000, 2)

    feedback_store.save_classification(complaint_id, complaint.text, classification.model_dump())

    # Enhancement 3: metrics
    metrics.record_classification(classification.category, classification.urgency)
    metrics.set_document_count(retriever.collection.count())

    extra_meta = {}
    if language_result and language_result.was_translated:
        extra_meta = {
            "detected_lang":      language_result.detected_lang,
            "was_translated":     True,
            "translation_method": language_result.translation_method,
        }
    if extra_meta:
        classification.metadata.update(extra_meta)

    response = ClassificationResponse(
        complaint_id=complaint_id, input_text=complaint.text,
        processing_time_ms=ms, retrieved_chunks=_chunks_to_model(chunks),
        classification=classification, hybrid_scores=FusionDebugInfo(**debug_info),
        cached=False,
    )
    if settings.cache_enabled:
        cache.set(ck, response)

    _total_classifications += 1
    _total_latency_ms += ms
    return response


# ── Health / Stats ────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(f"{settings.ollama_host}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception: pass
    cache = _get_cache()
    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        vector_db_count=retriever.collection.count(),
        ollama_reachable=ollama_ok,
        bm25_index_ready=retriever.bm25 is not None,
        cache_hit_rate=cache.hit_rate,
        uptime_seconds=round(time.monotonic() - _start_time, 1),
    )

@app.get("/stats", response_model=StatsResponse, tags=["System"])
async def get_stats():
    cache = _get_cache()
    avg_ms = round(_total_latency_ms / _total_classifications, 2) if _total_classifications else 0.0
    return StatsResponse(
        total_documents=retriever.collection.count(),
        total_classifications=_total_classifications,
        cache_hits=cache.hits, cache_misses=cache.misses,
        avg_processing_ms=avg_ms,
        index_status="healthy" if retriever.bm25 else "rebuilding",
        embedding_model=settings.ollama_embed_model,
        llm_model=settings.ollama_llm_model,
        fusion_method="Reciprocal Rank Fusion (RRF)",
        keyword_weight=settings.keyword_weight,
        semantic_weight=settings.semantic_weight,
    )


# ── Classification ────────────────────────────────────────────────────────────

@app.post("/classify", response_model=ClassificationResponse, tags=["Classification"])
async def classify_complaint(complaint: ComplaintInput):
    try:
        return await _classify_one(complaint)
    except HTTPException: raise
    except Exception as exc:
        logger.exception("Classify error")
        raise HTTPException(500, str(exc))

@app.post("/classify/batch", response_model=BatchClassificationResponse, tags=["Classification"])
async def classify_batch(batch: BatchComplaintInput):
    start = time.perf_counter()
    async def safe(c):
        try: return await _classify_one(c)
        except Exception as exc: return {"error": str(exc), "input_text": c.text}
    results = await asyncio.gather(*[safe(c) for c in batch.complaints])
    ok = sum(1 for r in results if isinstance(r, ClassificationResponse))
    return BatchClassificationResponse(
        total=len(results), successful=ok, failed=len(results)-ok, results=results,
        processing_time_ms=round((time.perf_counter()-start)*1000, 2),
    )

@app.post("/classify/stream", tags=["Classification"])
async def classify_stream(complaint: ComplaintInput):
    async def gen() -> AsyncGenerator[str, None]:
        def sse(d): return f"data: {json.dumps(d)}\n\n"
        try:
            complaint_id = f"COMP-{uuid.uuid4().hex[:8].upper()}"
            yield sse({"stage": "retrieval_start", "message": "Searching knowledge base…"})

            language_result = None
            if settings.multilang_enabled:
                try:
                    from language import get_language_processor
                    language_result = await get_language_processor().process(complaint.text)
                    if language_result.was_translated:
                        yield sse({"stage": "translated", "from": language_result.detected_lang,
                                   "method": language_result.translation_method})
                except Exception: pass

            chunks, debug = await retriever.retrieve(complaint.text, language_result=language_result)
            yield sse({"stage": "retrieval_complete", "chunks_found": len(chunks),
                "debug": debug,
                "chunks": [{"id": c["id"], "score": c["score"], "preview": c["text"][:120]} for c in chunks]})

            yield sse({"stage": "llm_start", "message": f"Analysing with {settings.ollama_llm_model}…"})
            clf = await llm_engine.classify(complaint.text, chunks)

            # Save to feedback store so feedback submissions can be matched
            feedback_store.save_classification(complaint_id, complaint.text, clf.model_dump())
            metrics.record_classification(clf.category, clf.urgency)

            yield sse({"stage": "complete", "complaint_id": complaint_id, "classification": clf.model_dump()})
        except Exception as exc:
            logger.exception("Stream error")
            yield sse({"stage": "error", "detail": str(exc)})
    return StreamingResponse(gen(), media_type="text/event-stream")


# ── Documents ─────────────────────────────────────────────────────────────────

@app.get("/documents", tags=["Documents"])
async def list_documents(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0)):
    d = retriever.collection.get(include=["documents","metadatas"])
    total = len(d["ids"])
    ids   = d["ids"][offset:offset+limit]
    docs  = d["documents"][offset:offset+limit]
    meta  = (d["metadatas"] or [{}]*total)[offset:offset+limit]
    return {"total": total, "limit": limit, "offset": offset,
        "documents": [{"id": i, "text": t[:200]+("…" if len(t)>200 else ""), "metadata": m}
                      for i, t, m in zip(ids, docs, meta)]}

@app.post("/documents", status_code=201, tags=["Documents"])
async def upsert_document(doc: DocumentUpsert):
    if retriever.document_exists(doc.id):
        retriever.update_document(doc.id, doc.text, doc.metadata)
        metrics.set_document_count(retriever.collection.count())
        return {"action": "updated", "id": doc.id}
    retriever.add_documents([doc.text], [doc.id], [doc.metadata])
    metrics.set_document_count(retriever.collection.count())
    return {"action": "created", "id": doc.id}

@app.delete("/documents/{doc_id}", tags=["Documents"])
async def delete_document(doc_id: str):
    if not retriever.document_exists(doc_id):
        raise HTTPException(404, f"Document '{doc_id}' not found.")
    retriever.delete_documents([doc_id])
    metrics.set_document_count(retriever.collection.count())
    return {"deleted": doc_id}


# ── Feedback ──────────────────────────────────────────────────────────────────

@app.post("/feedback", response_model=FeedbackResponse, tags=["Feedback"])
async def submit_feedback(feedback: FeedbackRequest):
    try:
        feedback_store.add_feedback(
            feedback.complaint_id, feedback.is_correct,
            feedback.correct_category,
            feedback.correct_urgency.value if feedback.correct_urgency else None,
            feedback.reviewer_note,
        )
        metrics.record_feedback(feedback.is_correct)
        return FeedbackResponse(accepted=True, message="Feedback recorded.")
    except Exception as exc:
        return FeedbackResponse(accepted=False, message=str(exc))

@app.get("/analytics", tags=["Feedback"])
async def get_analytics(limit: int = Query(1000, ge=10, le=10_000)):
    return {"accuracy": feedback_store.get_accuracy(limit), "recent_misclassifications": feedback_store.get_misclassified(20)}


# ── Admin — Enhancement 5 (few-shot) ─────────────────────────────────────────

@app.get("/admin/few-shot-examples", tags=["Admin"])
async def list_few_shot_examples():
    from few_shot_refresh import get_refresher
    r = get_refresher()
    if not r:
        return {"enabled": False, "examples": []}
    return {"enabled": True, "examples": r.active_examples, "last_refresh": r.last_refresh_iso,
            "count": len(r.active_examples)}

@app.post("/admin/refresh-prompts", tags=["Admin"])
async def trigger_few_shot_refresh():
    from few_shot_refresh import get_refresher
    r = get_refresher()
    if not r:
        raise HTTPException(503, "Few-shot refresher not initialised.")
    result = await r.refresh(force=True)
    return result


# ── Cache info & management ───────────────────────────────────────────────────

@app.get("/cache/info", tags=["System"])
async def cache_info():
    if settings.redis_enabled:
        from redis_cache import _registry
        return {ns: await c.info() for ns, c in _registry.items()}
    cache = get_query_cache()
    from cache import get_embed_cache
    embed = get_embed_cache()
    return {
        "query": {"hit_rate": cache.hit_rate, "hits": cache.hits, "misses": cache.misses, "size": cache.size},
        "embed": {"hit_rate": embed.hit_rate, "hits": embed.hits, "misses": embed.misses, "size": embed.size},
    }

@app.delete("/cache", tags=["System"])
async def clear_cache():
    if settings.redis_enabled:
        from redis_cache import _registry
        for c in _registry.values(): await c.aclear_namespace()
    else:
        get_query_cache().clear()
        from cache import get_embed_cache; get_embed_cache().clear()
    return {"message": "Cache cleared."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.app_host, port=settings.app_port,
                workers=settings.workers, log_level=settings.log_level, reload=False)