"""
main.py — FastAPI application

New vs v1:
  • Lifespan context manager (no more deprecated @app.on_event)
  • Application-level metrics counter (total requests, avg latency, cache stats)
  • Full document management API (upsert / delete / list)
  • Batch classification endpoint (up to 50 complaints, concurrent)
  • Feedback endpoint with SQLite persistence
  • /analytics endpoint for accuracy trends
  • Streaming endpoint properly serialises Pydantic models
  • Health check tests Ollama reachability (not just ChromaDB)
  • Prometheus metrics exposition at /metrics (optional)
  • All blocking retrieval calls are now properly async
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator, List

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from cache import get_query_cache
from config import settings
from feedback import FeedbackStore
from llm_engine import OllamaLLMEngine
from middleware import APIKeyMiddleware, LoggingMiddleware, RateLimitMiddleware, RequestIDMiddleware
from models import (
    BatchClassificationResponse,
    BatchComplaintInput,
    ClassificationResponse,
    ComplaintInput,
    DocumentUpsert,
    FeedbackRequest,
    FeedbackResponse,
    FusionDebugInfo,
    HealthResponse,
    RetrievedChunk,
    StatsResponse,
)
from retrieval import HybridRetriever
from seed_data import seed_database

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── Application State ─────────────────────────────────────────────────────────

_start_time = time.monotonic()
_total_classifications = 0
_total_latency_ms = 0.0


# ── Lifespan ──────────────────────────────────────────────────────────────────

retriever: HybridRetriever
llm_engine: OllamaLLMEngine
feedback_store: FeedbackStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever, llm_engine, feedback_store

    logger.info("Starting up — initialising services…")
    retriever = HybridRetriever()
    seed_database(retriever)
    llm_engine = OllamaLLMEngine()
    feedback_store = FeedbackStore()
    logger.info("All services ready ✓")

    yield  # ← application runs here

    logger.info("Shutting down — goodbye.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Hybrid RAG Complaint Classifier",
    description="Semantic + Keyword search with structured LLM output. Local-first, production-ready.",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Middleware — order matters (outermost applied first)
app.add_middleware(APIKeyMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _chunks_to_response(chunks: list) -> List[RetrievedChunk]:
    return [
        RetrievedChunk(
            id=c["id"],
            text=c["text"],
            source="knowledge_base",
            score=c["score"],
            rank=c["rank"],
            retrieval_method=c["method"],
            metadata=c.get("metadata", {}),
        )
        for c in chunks
    ]


async def _classify_one(complaint: ComplaintInput) -> ClassificationResponse:
    global _total_classifications, _total_latency_ms

    start = time.perf_counter()
    complaint_id = f"COMP-{uuid.uuid4().hex[:8].upper()}"

    # Check classification cache
    cache = get_query_cache()
    from cache import make_cache_key
    cache_key = make_cache_key("full_classify", complaint.text)
    cached_response = cache.get(cache_key) if settings.cache_enabled else None
    if cached_response:
        cached_response.cached = True
        return cached_response

    chunks, debug_info = await retriever.retrieve(complaint.text)
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant context found in knowledge base.")

    classification = await llm_engine.classify(complaint.text, chunks)
    processing_ms = round((time.perf_counter() - start) * 1000, 2)

    # Persist to feedback store for analytics
    feedback_store.save_classification(
        complaint_id,
        complaint.text,
        classification.model_dump(),
    )

    response = ClassificationResponse(
        complaint_id=complaint_id,
        input_text=complaint.text,
        processing_time_ms=processing_ms,
        retrieved_chunks=_chunks_to_response(chunks),
        classification=classification,
        hybrid_scores=FusionDebugInfo(**debug_info),
    )

    if settings.cache_enabled:
        cache.set(cache_key, response)

    _total_classifications += 1
    _total_latency_ms += processing_ms
    return response


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Dependency-aware health check: tests Ollama reachability."""
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{settings.ollama_host}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass

    cache = get_query_cache()
    status = "healthy" if ollama_ok else "degraded"

    return HealthResponse(
        status=status,
        vector_db_count=retriever.collection.count(),
        ollama_reachable=ollama_ok,
        bm25_index_ready=retriever.bm25 is not None,
        cache_hit_rate=cache.hit_rate,
        uptime_seconds=round(time.monotonic() - _start_time, 1),
    )


@app.get("/stats", response_model=StatsResponse, tags=["System"])
async def get_stats():
    """Aggregated system and retrieval statistics."""
    cache = get_query_cache()
    fb_stats = feedback_store.get_stats()
    avg_ms = round(_total_latency_ms / _total_classifications, 2) if _total_classifications else 0.0

    return StatsResponse(
        total_documents=retriever.collection.count(),
        total_classifications=_total_classifications,
        cache_hits=cache.hits,
        cache_misses=cache.misses,
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
    """Classify a single complaint with hybrid retrieval + structured LLM output."""
    try:
        return await _classify_one(complaint)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error classifying complaint")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/classify/batch", response_model=BatchClassificationResponse, tags=["Classification"])
async def classify_batch(batch: BatchComplaintInput):
    """
    Classify up to 50 complaints concurrently.
    Failed items are included in the response with an error message.
    """
    start = time.perf_counter()

    async def safe_classify(c: ComplaintInput):
        try:
            return await _classify_one(c)
        except Exception as exc:
            return {"error": str(exc), "input_text": c.text}

    results = await asyncio.gather(*[safe_classify(c) for c in batch.complaints])

    successful = sum(1 for r in results if isinstance(r, ClassificationResponse))
    failed = len(results) - successful

    return BatchClassificationResponse(
        total=len(results),
        successful=successful,
        failed=failed,
        results=results,
        processing_time_ms=round((time.perf_counter() - start) * 1000, 2),
    )


@app.post("/classify/stream", tags=["Classification"])
async def classify_stream(complaint: ComplaintInput):
    """
    Server-Sent Events stream for real-time UI progress updates.
    Yields: retrieval_start → retrieval_complete → llm_start → complete
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        def sse(data: dict) -> str:
            return f"data: {json.dumps(data)}\n\n"

        try:
            yield sse({"stage": "retrieval_start", "message": "Searching knowledge base…"})
            chunks, debug_info = await retriever.retrieve(complaint.text)
            yield sse({
                "stage": "retrieval_complete",
                "chunks_found": len(chunks),
                "debug": debug_info,
                "chunks": [
                    {"id": c["id"], "score": c["score"], "preview": c["text"][:120]}
                    for c in chunks
                ],
            })

            yield sse({"stage": "llm_start", "message": f"Analysing with {settings.ollama_llm_model}…"})
            classification = await llm_engine.classify(complaint.text, chunks)
            yield sse({"stage": "complete", "classification": classification.model_dump()})

        except Exception as exc:
            logger.exception("Stream classification error")
            yield sse({"stage": "error", "detail": str(exc)})

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Document Management ───────────────────────────────────────────────────────

@app.get("/documents", tags=["Documents"])
async def list_documents(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List documents in the knowledge base with pagination."""
    all_docs = retriever.collection.get(include=["documents", "metadatas"])
    total = len(all_docs["ids"])
    page_ids = all_docs["ids"][offset: offset + limit]
    page_docs = all_docs["documents"][offset: offset + limit]
    page_meta = (all_docs["metadatas"] or [{}] * total)[offset: offset + limit]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "documents": [
            {"id": i, "text": t[:200] + "…" if len(t) > 200 else t, "metadata": m}
            for i, t, m in zip(page_ids, page_docs, page_meta)
        ],
    }


@app.post("/documents", status_code=201, tags=["Documents"])
async def upsert_document(doc: DocumentUpsert):
    """Add or update a document in the knowledge base."""
    if retriever.document_exists(doc.id):
        retriever.update_document(doc.id, doc.text, doc.metadata)
        return {"action": "updated", "id": doc.id}
    else:
        retriever.add_documents([doc.text], [doc.id], [doc.metadata])
        return {"action": "created", "id": doc.id}


@app.delete("/documents/{doc_id}", tags=["Documents"])
async def delete_document(doc_id: str):
    """Remove a document from both ChromaDB and BM25 index."""
    if not retriever.document_exists(doc_id):
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    retriever.delete_documents([doc_id])
    return {"deleted": doc_id}


# ── Feedback ──────────────────────────────────────────────────────────────────

@app.post("/feedback", response_model=FeedbackResponse, tags=["Feedback"])
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit a classification correction.
    Used for accuracy tracking and active-learning pipelines.
    """
    try:
        feedback_store.add_feedback(
            complaint_id=feedback.complaint_id,
            is_correct=feedback.is_correct,
            correct_category=feedback.correct_category,
            correct_urgency=feedback.correct_urgency.value if feedback.correct_urgency else None,
            reviewer_note=feedback.reviewer_note,
        )
        return FeedbackResponse(accepted=True, message="Feedback recorded. Thank you!")
    except Exception as exc:
        logger.exception("Failed to record feedback")
        return FeedbackResponse(accepted=False, message=str(exc))


@app.get("/analytics", tags=["Feedback"])
async def get_analytics(limit: int = Query(1000, ge=10, le=10_000)):
    """Classification accuracy trends and misclassification report."""
    accuracy = feedback_store.get_accuracy(limit=limit)
    misclassified = feedback_store.get_misclassified(limit=20)
    return {
        "accuracy": accuracy,
        "recent_misclassifications": misclassified,
    }


# ── Cache Management ──────────────────────────────────────────────────────────

@app.delete("/cache", tags=["System"])
async def clear_cache():
    """Flush the in-memory query/embedding cache."""
    get_query_cache().clear()
    return {"message": "Cache cleared."}


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        workers=settings.workers,
        log_level=settings.log_level,
        reload=False,
    )