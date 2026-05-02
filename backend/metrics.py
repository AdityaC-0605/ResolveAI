"""
metrics.py — Prometheus instrumentation

Enhancement 3: Prometheus Metrics
───────────────────────────────────
Exposes a /metrics endpoint (Prometheus text format) that Grafana, Datadog
agent, or any OpenMetrics scraper can consume.

Metrics exposed
  ┌──────────────────────────────────────┬──────────────┬─────────────────────────────┐
  │ Metric                               │ Type         │ Labels                      │
  ├──────────────────────────────────────┼──────────────┼─────────────────────────────┤
  │ rag_requests_total                   │ Counter      │ endpoint, status            │
  │ rag_request_duration_seconds         │ Histogram    │ endpoint                    │
  │ rag_classification_category_total    │ Counter      │ category, urgency           │
  │ rag_retrieval_chunks_retrieved       │ Histogram    │ method (keyword/semantic)   │
  │ rag_cache_operations_total           │ Counter      │ cache, operation (hit/miss) │
  │ rag_llm_duration_seconds             │ Histogram    │ model                       │
  │ rag_rerank_duration_seconds          │ Histogram    │ method (neural/tfidf)       │
  │ rag_hyde_duration_seconds            │ Histogram    │ –                           │
  │ rag_document_count                   │ Gauge        │ –                           │
  │ rag_feedback_total                   │ Counter      │ verdict (correct/incorrect) │
  └──────────────────────────────────────┴──────────────┴─────────────────────────────┘

Integration into main.py
  from metrics import setup_metrics, metrics
  setup_metrics(app)          # call once after app is created
  # Then use context managers anywhere:
  with metrics.time_llm():
      result = await llm_engine.classify(...)

Grafana dashboard
  Import the bundled dashboard JSON from docs/grafana_dashboard.json, point
  the datasource at your Prometheus instance, and you get latency percentiles,
  error rates, category distribution and cache efficiency out of the box.
"""

from __future__ import annotations

import time
import logging
from contextlib import contextmanager
from typing import TYPE_CHECKING

from config import settings

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = logging.getLogger(__name__)

# ── Lazy import so the app works without prometheus_client installed ───────────

try:
    from prometheus_client import (
        Counter, Histogram, Gauge,
    )
    from prometheus_fastapi_instrumentator import Instrumentator
    _PROMETHEUS_AVAILABLE = True
except ImportError:
    _PROMETHEUS_AVAILABLE = False
    logger.warning(
        "prometheus_client / prometheus-fastapi-instrumentator not installed. "
        "Metrics endpoint will be disabled. "
        "Run: pip install prometheus-client prometheus-fastapi-instrumentator"
    )


# ── Metric definitions ────────────────────────────────────────────────────────

class _Metrics:
    """Holds all Prometheus metric objects. Created once at module load."""

    def __init__(self) -> None:
        if not _PROMETHEUS_AVAILABLE:
            return

        self.requests_total = Counter(
            "rag_requests_total",
            "Total HTTP requests",
            ["endpoint", "status"],
        )
        self.request_duration = Histogram(
            "rag_request_duration_seconds",
            "HTTP request latency",
            ["endpoint"],
            buckets=[0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
        )
        self.classification_category = Counter(
            "rag_classification_category_total",
            "Classifications broken down by category and urgency",
            ["category", "urgency"],
        )
        self.chunks_retrieved = Histogram(
            "rag_retrieval_chunks_retrieved",
            "Number of chunks returned per retrieval method",
            ["method"],
            buckets=[1, 2, 5, 10, 20, 50],
        )
        self.cache_ops = Counter(
            "rag_cache_operations_total",
            "Cache hits and misses",
            ["cache", "operation"],
        )
        self.llm_duration = Histogram(
            "rag_llm_duration_seconds",
            "Time spent waiting for Ollama LLM response",
            ["model"],
            buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60],
        )
        self.rerank_duration = Histogram(
            "rag_rerank_duration_seconds",
            "Re-ranking latency split by method",
            ["method"],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1],
        )
        self.hyde_duration = Histogram(
            "rag_hyde_duration_seconds",
            "HyDE hypothetical generation latency",
            buckets=[0.1, 0.5, 1, 2, 5, 10],
        )
        self.document_count = Gauge(
            "rag_document_count",
            "Total documents currently in the vector store",
        )
        self.feedback_total = Counter(
            "rag_feedback_total",
            "User feedback submissions",
            ["verdict"],  # correct | incorrect
        )

    # ── Context managers for timing ───────────────────────────────────────────

    @contextmanager
    def time_llm(self, model: str = ""):
        if not _PROMETHEUS_AVAILABLE:
            yield; return
        model = model or settings.ollama_llm_model
        start = time.perf_counter()
        try:
            yield
        finally:
            self.llm_duration.labels(model=model).observe(time.perf_counter() - start)

    @contextmanager
    def time_rerank(self, method: str = "tfidf"):
        if not _PROMETHEUS_AVAILABLE:
            yield; return
        start = time.perf_counter()
        try:
            yield
        finally:
            self.rerank_duration.labels(method=method).observe(time.perf_counter() - start)

    @contextmanager
    def time_hyde(self):
        if not _PROMETHEUS_AVAILABLE:
            yield; return
        start = time.perf_counter()
        try:
            yield
        finally:
            self.hyde_duration.observe(time.perf_counter() - start)

    # ── One-shot helpers ──────────────────────────────────────────────────────

    def record_classification(self, category: str, urgency: str) -> None:
        if not _PROMETHEUS_AVAILABLE:
            return
        self.classification_category.labels(category=category, urgency=urgency).inc()

    def record_cache(self, cache_name: str, hit: bool) -> None:
        if not _PROMETHEUS_AVAILABLE:
            return
        self.cache_ops.labels(cache=cache_name, operation="hit" if hit else "miss").inc()

    def record_chunks(self, method: str, count: int) -> None:
        if not _PROMETHEUS_AVAILABLE:
            return
        self.chunks_retrieved.labels(method=method).observe(count)

    def record_feedback(self, is_correct: bool) -> None:
        if not _PROMETHEUS_AVAILABLE:
            return
        self.feedback_total.labels(verdict="correct" if is_correct else "incorrect").inc()

    def set_document_count(self, n: int) -> None:
        if not _PROMETHEUS_AVAILABLE:
            return
        self.document_count.set(n)


# ── Module-level singleton ─────────────────────────────────────────────────────
metrics = _Metrics()


# ── FastAPI wiring ─────────────────────────────────────────────────────────────

def setup_metrics(app: "FastAPI") -> None:
    """
    Call once after creating the FastAPI app.

    Adds:
      • Auto-instrumentation of all routes (via Instrumentator)
      • GET /metrics  — raw Prometheus scrape endpoint
    """
    if not settings.enable_prometheus or not _PROMETHEUS_AVAILABLE:
        logger.info("Prometheus metrics disabled (enable_prometheus=false or library missing).")
        return

    # Auto-instrument all routes — adds request count + latency histograms
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=False,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/metrics", "/health"],
    ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

    logger.info("Prometheus metrics enabled → GET /metrics")