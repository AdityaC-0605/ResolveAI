"""
config.py — Centralised settings with environment variable support.

Usage:
    from config import settings
    print(settings.ollama_host)

All values can be overridden via a .env file or shell environment variables.
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Ollama ────────────────────────────────────────────────────────────────
    ollama_host: str = "http://localhost:11434"
    ollama_llm_model: str = "llama3.2"
    ollama_embed_model: str = "nomic-embed-text"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 800
    llm_top_p: float = 0.9
    ollama_timeout_seconds: float = 120.0
    ollama_max_retries: int = 3
    ollama_retry_backoff: float = 2.0        # seconds; doubles each retry

    # ── ChromaDB ──────────────────────────────────────────────────────────────
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "complaints"

    # ── Retrieval ─────────────────────────────────────────────────────────────
    keyword_weight: float = 0.35
    semantic_weight: float = 0.65
    rrf_k: float = 60.0
    top_k: int = 5
    retrieval_multiplier: int = 3            # fetch top_k * multiplier, fuse, return top_k

    # ── Caching ───────────────────────────────────────────────────────────────
    cache_enabled: bool = True
    cache_ttl_seconds: int = 300             # 5-minute TTL for query/embed caches
    cache_max_size: int = 512               # max LRU entries

    # ── Re-ranking ────────────────────────────────────────────────────────────
    rerank_enabled: bool = True
    rerank_top_n: int = 5                   # how many docs to keep after re-ranking

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 60           # per window
    rate_limit_window_seconds: int = 60

    # ── API Security ──────────────────────────────────────────────────────────
    api_keys_enabled: bool = False          # set True + populate api_keys to require auth
    api_keys: List[str] = []               # e.g. ["key-abc123", "key-xyz456"]

    # ── Feedback ──────────────────────────────────────────────────────────────
    feedback_db_path: str = "./feedback.db"

    # ── Analytics ─────────────────────────────────────────────────────────────
    enable_prometheus: bool = True
    metrics_port: int = 9090

    # ── App ───────────────────────────────────────────────────────────────────
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    workers: int = 1
    log_level: str = "info"
    cors_origins: List[str] = ["*"]

    # ── Derived helpers (not env vars) ────────────────────────────────────────
    @property
    def ollama_generate_url(self) -> str:
        return f"{self.ollama_host}/api/generate"

    @property
    def ollama_embed_url(self) -> str:
        return f"{self.ollama_host}/api/embeddings"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()