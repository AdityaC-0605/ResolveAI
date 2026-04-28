"""
cache.py — Lightweight TTL-aware LRU cache.

Why not Redis? The project is local-first with zero external dependencies.
This in-process cache covers the common hot-path (repeated queries / embeddings)
and is replaced by Redis trivially by swapping the backend in `get_cache()`.

Thread-safety: operations use a threading.Lock so this is safe with uvicorn's
sync thread pool (run_in_executor). For multi-process deployments, switch to Redis.
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
import time
from collections import OrderedDict
from typing import Any, Optional

logger = logging.getLogger(__name__)


class TTLCache:
    """Least-Recently-Used cache with per-entry time-to-live."""

    def __init__(self, max_size: int = 512, ttl_seconds: int = 300) -> None:
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    # ── Public API ────────────────────────────────────────────────────────────

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._store:
                self._misses += 1
                return None
            value, expires_at = self._store[key]
            if time.monotonic() > expires_at:
                del self._store[key]
                self._misses += 1
                return None
            # Move to end (most-recently used)
            self._store.move_to_end(key)
            self._hits += 1
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            if key in self._store:
                self._store.move_to_end(key)
            self._store[key] = (value, time.monotonic() + self._ttl)
            if len(self._store) > self._max_size:
                evicted_key, _ = self._store.popitem(last=False)
                logger.debug("Cache evicted key: %s", evicted_key)

    def invalidate(self, key: str) -> bool:
        with self._lock:
            return self._store.pop(key, None) is not None

    def clear(self) -> None:
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    @property
    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return round(self._hits / total, 4) if total else 0.0

    @property
    def hits(self) -> int:
        return self._hits

    @property
    def misses(self) -> int:
        return self._misses

    @property
    def size(self) -> int:
        with self._lock:
            return len(self._store)


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_cache_key(*parts: Any) -> str:
    """Stable, collision-resistant key from arbitrary positional args."""
    raw = json.dumps(parts, sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


# ── Singleton ─────────────────────────────────────────────────────────────────

_query_cache: Optional[TTLCache] = None
_embed_cache: Optional[TTLCache] = None


def get_query_cache() -> TTLCache:
    global _query_cache
    if _query_cache is None:
        from config import settings
        _query_cache = TTLCache(
            max_size=settings.cache_max_size,
            ttl_seconds=settings.cache_ttl_seconds,
        )
    return _query_cache


def get_embed_cache() -> TTLCache:
    global _embed_cache
    if _embed_cache is None:
        from config import settings
        _embed_cache = TTLCache(
            max_size=settings.cache_max_size * 4,   # embeddings are cheap to store
            ttl_seconds=settings.cache_ttl_seconds * 12,  # embeddings rarely change
        )
    return _embed_cache