"""
middleware.py — Starlette/FastAPI middleware stack

Middleware applied (in order, outermost first):
  1. RequestIDMiddleware     — attaches X-Request-ID for distributed tracing
  2. LoggingMiddleware       — structured request/response logs
  3. RateLimitMiddleware     — sliding-window IP-based rate limiting
  4. APIKeyMiddleware        — optional bearer/x-api-key enforcement
"""

from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict, deque
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from config import settings

logger = logging.getLogger(__name__)


# ── Request ID ────────────────────────────────────────────────────────────────

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ── Structured Logging ────────────────────────────────────────────────────────

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        req_id = getattr(request.state, "request_id", "-")
        logger.info(
            "method=%s path=%s status=%d duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            req_id,
        )
        return response


# ── Sliding-Window Rate Limiter ───────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Per-IP sliding-window rate limiter backed by an in-process deque.
    For multi-process deployments, replace with a Redis INCR + EXPIRE approach.
    """

    EXEMPT_PATHS = {"/health", "/metrics", "/docs", "/openapi.json", "/redoc"}

    def __init__(self, app, **kwargs) -> None:
        super().__init__(app, **kwargs)
        self._windows: dict[str, deque] = defaultdict(deque)
        self._limit = settings.rate_limit_requests
        self._window = settings.rate_limit_window_seconds

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.rate_limit_enabled or request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        ip = self._get_client_ip(request)
        now = time.monotonic()
        window = self._windows[ip]

        # Evict timestamps outside the window
        while window and window[0] < now - self._window:
            window.popleft()

        if len(window) >= self._limit:
            retry_after = int(self._window - (now - window[0])) + 1
            return JSONResponse(
                {"detail": "Rate limit exceeded. Please slow down."},
                status_code=429,
                headers={"Retry-After": str(retry_after)},
            )

        window.append(now)
        return await call_next(request)


# ── API Key Auth ──────────────────────────────────────────────────────────────

class APIKeyMiddleware(BaseHTTPMiddleware):
    EXEMPT_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.api_keys_enabled or request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Accept via Authorization: Bearer <key> OR X-API-Key: <key>
        auth_header = request.headers.get("Authorization", "")
        api_key = ""
        if auth_header.startswith("Bearer "):
            api_key = auth_header[7:].strip()
        else:
            api_key = request.headers.get("X-API-Key", "").strip()

        if api_key not in settings.api_keys:
            return JSONResponse(
                {"detail": "Invalid or missing API key."},
                status_code=401,
            )
        return await call_next(request)