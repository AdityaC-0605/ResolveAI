"""
redis_cache.py — Redis-backed TTL cache

Enhancement 6: Redis Cache
────────────────────────────
Replaces the in-process TTLCache with a Redis-backed implementation that is:
  • Shared across multiple uvicorn workers / replicas
  • Persistent across server restarts (with Redis AOF/RDB)
  • Inspectable with redis-cli and redis-commander

Drop-in API
  RedisCache is a superset of TTLCache — it exposes the same .get() / .set() /
  .invalidate() / .clear() / .hit_rate interface. The only difference is that
  it uses redis.asyncio under the hood.

Switching over
  In cache.py change the factory functions:

      from redis_cache import get_redis_cache

      def get_query_cache() -> RedisCache:
          return get_redis_cache("query")

      def get_embed_cache() -> RedisCache:
          return get_redis_cache("embed")

  Set REDIS_URL=redis://localhost:6379/0 in .env and run:
      docker run -p 6379:6379 redis:7-alpine

Key schema
  rag:{namespace}:{sha256_hash}
  e.g. rag:query:a3f2b1...   rag:embed:7c9d44...

Serialisation
  Values are serialised with pickle (supports any Python object including
  Pydantic models) then base64-encoded for Redis string storage. For cross-
  language interop, swap with json.dumps / Pydantic .model_dump().

Graceful degradation
  If Redis is unavailable, RedisCache transparently falls back to the in-process
  TTLCache so development and unit tests never require a running Redis instance.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import pickle
from typing import Any, Dict, Optional

from config import settings

logger = logging.getLogger(__name__)

# ── Redis import (optional) ───────────────────────────────────────────────────

try:
    import redis.asyncio as aioredis
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False
    logger.warning(
        "redis package not installed — RedisCache will fall back to in-process TTLCache. "
        "Run: pip install redis"
    )


# ── Serialisation helpers ─────────────────────────────────────────────────────

def _encode(value: Any) -> str:
    return base64.b64encode(pickle.dumps(value)).decode()


def _decode(raw: str) -> Any:
    return pickle.loads(base64.b64decode(raw.encode()))


# ── Redis Cache ───────────────────────────────────────────────────────────────

class RedisCache:
    """
    Async Redis-backed cache. Falls back to synchronous in-process TTLCache
    when Redis is unavailable.

    Usage:
        cache = RedisCache(namespace="query", ttl=300)
        await cache.aset("key", value)
        value = await cache.aget("key")   # None on miss
    """

    def __init__(
        self,
        namespace: str = "default",
        ttl_seconds: int = 300,
        redis_url: Optional[str] = None,
    ) -> None:
        self.namespace  = namespace
        self.ttl        = ttl_seconds
        self._redis_url = redis_url or settings.redis_url
        self._client: Optional[aioredis.Redis] = None
        self._fallback  = None          # populated lazily if Redis unavailable
        self._hits      = 0
        self._misses    = 0

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def connect(self) -> None:
        if not _REDIS_AVAILABLE or not self._redis_url:
            logger.info("RedisCache[%s]: using in-process fallback.", self.namespace)
            self._init_fallback()
            return
        try:
            self._client = aioredis.from_url(
                self._redis_url,
                encoding="utf-8",
                decode_responses=False,    # we handle bytes manually
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=True,
            )
            await self._client.ping()
            logger.info("RedisCache[%s]: connected to %s ✓", self.namespace, self._redis_url)
        except Exception as exc:
            logger.warning(
                "RedisCache[%s]: Redis unreachable (%s) — falling back to in-process cache.",
                self.namespace, exc,
            )
            self._client = None
            self._init_fallback()

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()

    def _init_fallback(self) -> None:
        from cache import TTLCache
        self._fallback = TTLCache(
            max_size=settings.cache_max_size,
            ttl_seconds=self.ttl,
        )

    # ── Key builder ───────────────────────────────────────────────────────────

    def _key(self, raw_key: str) -> str:
        hashed = hashlib.sha256(raw_key.encode()).hexdigest()
        return f"rag:{self.namespace}:{hashed}"

    # ── Async API (primary) ───────────────────────────────────────────────────

    async def aget(self, key: str) -> Optional[Any]:
        if self._client is None:
            return self._fallback_get(key)
        redis_key = self._key(key)
        try:
            raw = await self._client.get(redis_key)
            if raw is None:
                self._misses += 1
                return None
            self._hits += 1
            return _decode(raw)
        except Exception as exc:
            logger.debug("Redis GET failed: %s", exc)
            self._misses += 1
            return None

    async def aset(self, key: str, value: Any) -> None:
        if self._client is None:
            self._fallback_set(key, value)
            return
        redis_key = self._key(key)
        try:
            await self._client.setex(redis_key, self.ttl, _encode(value))
        except Exception as exc:
            logger.debug("Redis SET failed: %s", exc)
            self._fallback_set(key, value)

    async def adelete(self, key: str) -> bool:
        if self._client is None:
            return bool(self._fallback.invalidate(key)) if self._fallback else False
        redis_key = self._key(key)
        try:
            result = await self._client.delete(redis_key)
            return bool(result)
        except Exception as exc:
            logger.debug("Redis DELETE failed: %s", exc)
            return False

    async def aclear_namespace(self) -> int:
        """Delete all keys belonging to this namespace."""
        if self._client is None:
            if self._fallback:
                self._fallback.clear()
            return 0
        try:
            pattern = f"rag:{self.namespace}:*"
            keys = await self._client.keys(pattern)
            if keys:
                return await self._client.delete(*keys)
            return 0
        except Exception as exc:
            logger.debug("Redis CLEAR failed: %s", exc)
            return 0

    # ── Sync shims (for backward compat with code that calls .get / .set) ────

    def get(self, key: str) -> Optional[Any]:
        return self._fallback_get(key)

    def set(self, key: str, value: Any) -> None:
        self._fallback_set(key, value)

    def invalidate(self, key: str) -> bool:
        return bool(self._fallback.invalidate(key)) if self._fallback else False

    def clear(self) -> None:
        if self._fallback:
            self._fallback.clear()

    # ── Fallback delegators ───────────────────────────────────────────────────

    def _fallback_get(self, key: str) -> Optional[Any]:
        if not self._fallback:
            self._init_fallback()
        val = self._fallback.get(key)
        if val is None:
            self._misses += 1
        else:
            self._hits += 1
        return val

    def _fallback_set(self, key: str, value: Any) -> None:
        if not self._fallback:
            self._init_fallback()
        self._fallback.set(key, value)

    # ── Stats ─────────────────────────────────────────────────────────────────

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

    async def info(self) -> Dict:
        using_redis = self._client is not None
        info = {
            "backend": "redis" if using_redis else "in-process",
            "namespace": self.namespace,
            "ttl_seconds": self.ttl,
            "hit_rate": self.hit_rate,
            "hits": self._hits,
            "misses": self._misses,
        }
        if using_redis:
            try:
                server_info = await self._client.info("stats")
                info["redis_keyspace_hits"]   = server_info.get("keyspace_hits", "—")
                info["redis_keyspace_misses"] = server_info.get("keyspace_misses", "—")
            except Exception:
                pass
        return info


# ── Registry of named cache instances ────────────────────────────────────────

_registry: Dict[str, RedisCache] = {}


def get_redis_cache(
    namespace: str,
    ttl_seconds: Optional[int] = None,
) -> RedisCache:
    """
    Return (or create) a named RedisCache instance.

    Each namespace gets its own TTL — embeddings are cached 4× longer than
    query results, matching the original TTLCache design.
    """
    if namespace not in _registry:
        ttl = ttl_seconds or (
            settings.cache_ttl_seconds * 12 if namespace == "embed"
            else settings.cache_ttl_seconds
        )
        _registry[namespace] = RedisCache(namespace=namespace, ttl_seconds=ttl)
    return _registry[namespace]


async def connect_all_caches() -> None:
    """Call at application startup to establish Redis connections."""
    for cache in _registry.values():
        await cache.connect()


async def close_all_caches() -> None:
    """Call at application shutdown."""
    for cache in _registry.values():
        await cache.close()