"""
hyde.py — Hypothetical Document Embeddings (HyDE)

Enhancement 2: HyDE
────────────────────
Original paper: "Precise Zero-Shot Dense Retrieval without Relevance Labels"
(Gao et al., 2022)  https://arxiv.org/abs/2212.10496

Why HyDE?
  Standard semantic search embeds the *query* ("I can't log in after reset")
  and retrieves docs whose embeddings are close in vector space. The problem:
  a short, vague complaint lives in a very different region of embedding space
  than a verbose, well-labelled knowledge-base document — even when they are
  semantically identical. The embedding model was trained on (query, doc) pairs
  but the query distribution and the doc distribution remain separate.

  HyDE bridges this gap:
    1.  Ask the LLM: "Write a hypothetical ideal support complaint about this issue."
    2.  Embed that *hypothetical document* instead of the raw query.
    3.  The hypothetical lives in the *document* region of embedding space,
        so retrieval accuracy improves — especially for short or vague inputs.

  Observed gains on retrieval benchmarks: +5–15% Recall@5 on short queries.

Integration
  Call `hyde_query()` in the retrieval pipeline's semantic_search path.
  The BM25 path always uses the raw query (HyDE doesn't help keyword matching).

  In retrieval.py's retrieve() method, replace:
      semantic_results = self.semantic_search(query, fetch_k, filter_dict)
  with:
      from hyde import get_hyde
      hyde_query_text = await get_hyde().expand(query)
      semantic_results = self.semantic_search(hyde_query_text, fetch_k, filter_dict)
"""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Optional

import httpx

from cache import get_query_cache, make_cache_key
from config import settings

logger = logging.getLogger(__name__)


HYDE_SYSTEM_PROMPT = """You are a customer support document generator.
Given a raw customer complaint, write ONE hypothetical, well-structured support
ticket that captures the same issue. Write it as if it were already in a
knowledge base — include typical complaint language, possible order/account
references, and outcome requests. Keep it under 120 words. No extra commentary."""


class HyDEExpander:
    """
    Generates a hypothetical document from a raw query using the local LLM,
    then returns that document as the new query string for semantic search.

    Results are cached so repeated identical queries hit the LLM only once.
    """

    def __init__(self) -> None:
        self._cache = get_query_cache()
        self._generate_url = settings.ollama_generate_url

    async def expand(self, query: str, timeout: float = 12.0) -> str:
        """
        Return a hypothetical document string.
        Falls back to original query on any failure so the pipeline never breaks.
        """
        if not settings.hyde_enabled:
            return query

        # Short queries benefit most from HyDE; long ones are often fine raw
        if len(query.split()) >= 40:
            logger.debug("HyDE skipped — query is long enough (%d words)", len(query.split()))
            return query

        cache_key = make_cache_key("hyde", query)
        cached = self._cache.get(cache_key)
        if cached is not None:
            logger.debug("HyDE cache hit")
            return cached

        payload = {
            "model": settings.ollama_llm_model,
            "prompt": f"{HYDE_SYSTEM_PROMPT}\n\nCustomer complaint:\n\"{query}\"\n\nHypothetical support document:",
            "stream": False,
            "options": {
                "temperature": 0.5,   # slight creativity for diversity
                "num_predict": 150,
            },
        }

        for attempt in range(settings.ollama_max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(self._generate_url, json=payload)
                    resp.raise_for_status()
                    hypothetical = resp.json().get("response", "").strip()

                if not hypothetical:
                    return query

                # Use a blend: hypothetical stitched with original query
                # Embedding the concatenation keeps both lexical and semantic signals
                blended = f"{hypothetical}\n\nOriginal query: {query}"
                self._cache.set(cache_key, blended)
                logger.debug("HyDE generated %d chars for query", len(blended))
                return blended

            except asyncio.TimeoutError:
                logger.warning("HyDE timeout on attempt %d — using raw query", attempt + 1)
                return query
            except httpx.HTTPError as exc:
                if attempt < settings.ollama_max_retries - 1:
                    await asyncio.sleep(settings.ollama_retry_backoff * (2 ** attempt) + random.uniform(0, 0.3))
                else:
                    logger.warning("HyDE failed after %d attempts (%s) — using raw query", attempt + 1, exc)
                    return query

        return query


# ── Singleton ─────────────────────────────────────────────────────────────────

_hyde: Optional[HyDEExpander] = None


def get_hyde() -> HyDEExpander:
    global _hyde
    if _hyde is None:
        _hyde = HyDEExpander()
    return _hyde