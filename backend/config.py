"""
config.py — Centralised settings with environment variable support.
Includes all Enhancement flags (v2).
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
    ollama_retry_backoff: float = 2.0

    # ── ChromaDB ──────────────────────────────────────────────────────────────
    chroma_persist_dir: str = "./chroma_db"
    chroma_collection_name: str = "complaints"

    # ── Retrieval ─────────────────────────────────────────────────────────────
    keyword_weight: float = 0.35
    semantic_weight: float = 0.65
    rrf_k: float = 60.0
    top_k: int = 5
    retrieval_multiplier: int = 3

    # ── Caching (base TTLCache) ───────────────────────────────────────────────
    cache_enabled: bool = True
    cache_ttl_seconds: int = 300
    cache_max_size: int = 512

    # ── Enhancement 1: Neural Re-ranking ─────────────────────────────────────
    rerank_enabled: bool = True
    rerank_top_n: int = 5
    rerank_method: str = "neural"   # "neural" | "tfidf"
    rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # ── Enhancement 2: HyDE ───────────────────────────────────────────────────
    hyde_enabled: bool = False
    hyde_timeout_seconds: float = 12.0

    # ── Enhancement 3: Prometheus ─────────────────────────────────────────────
    enable_prometheus: bool = True
    metrics_port: int = 9090

    # ── Enhancement 4: Multi-language ────────────────────────────────────────
    multilang_enabled: bool = True
    multilang_strategy: str = "translate"   # "translate" | "multilingual" | "hybrid"
    libretranslate_url: str = ""
    multilang_embed_model: str = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

    # ── Enhancement 5: Few-shot refresh ──────────────────────────────────────
    few_shot_refresh_enabled: bool = True
    few_shot_refresh_interval_hours: int = 6
    few_shot_cache_file: str = "few_shot_cache.json"

    # ── Enhancement 6: Redis cache ────────────────────────────────────────────
    redis_enabled: bool = False
    redis_url: str = "redis://localhost:6379/0"

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 60
    rate_limit_window_seconds: int = 60

    # ── API Security ──────────────────────────────────────────────────────────
    api_keys_enabled: bool = False
    api_keys: List[str] = []

    # ── Feedback ──────────────────────────────────────────────────────────────
    feedback_db_path: str = "./feedback.db"

    # ── App ───────────────────────────────────────────────────────────────────
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    workers: int = 1
    log_level: str = "info"
    cors_origins: List[str] = ["*"]

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