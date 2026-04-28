"""
llm_engine.py — Robust Ollama LLM client

Improvements over v1:
  • Async-native: fully async, no blocking calls on the event loop
  • Retry with exponential back-off + jitter
  • Result caching: identical (complaint, chunk_ids) pairs skip LLM entirely
  • Query expansion: generates alternative phrasings to improve recall
  • Richer system prompt with few-shot examples
  • Safe JSON extraction with multiple fallback strategies
  • Confidence auto-adjustment when fields look generic/empty
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
import re
from typing import Dict, List, Optional, Tuple

import httpx

from cache import get_query_cache, make_cache_key
from config import settings
from models import StructuredClassification

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are an expert Customer Support Intelligence analyst with years of experience classifying, prioritising, and routing support tickets.

You will be given:
  1. A raw customer complaint.
  2. Retrieved similar complaints from the knowledge base (with their known categories).

Your task is to analyse the complaint and return a single valid JSON object — nothing else.
No markdown, no code fences, no preamble. Pure JSON.

CLASSIFICATION RULES:
  • category: exactly one of [Billing, Technical, Account, Product-Quality, Shipping, Service, Fraud-Security, Unknown]
  • subcategory: a specific slug (e.g. "double-charge", "login-failure", "defective-item")
  • sentiment: exactly one of [angry, frustrated, neutral, concerned]
  • urgency:
      - critical → security breach, safety risk, or account locked with financial exposure
      - high     → immediate financial loss, service completely broken, imminent deadline
      - medium   → inconvenience, partial failure, delayed refund
      - low      → cosmetic issue, general feedback, promo code failure
  • confidence: your certainty 0.0–1.0 (be honest — prefer 0.6 over false 0.95)
  • summary: 1-2 sentence summary of the complaint
  • reasoning: step-by-step reasoning for the classification
  • action_items: array of action strings to take
  • assigned_team: team assigned to handle the issue
  • estimated_resolution_hours: realistic SLA integer (e.g. 1, 4, 24, 48, 72)

FEW-SHOT EXAMPLES (for calibration):

Input: "I was charged twice — $49.99 appears twice on my statement."
Output:
{
  "category": "Billing",
  "subcategory": "double-charge",
  "sentiment": "frustrated",
  "urgency": "high",
  "confidence": 0.97,
  "summary": "Customer reports a duplicate subscription charge and requests refund.",
  "reasoning": "1. Complaint explicitly mentions being charged twice. 2. Retrieved similar complaints confirm 'double-charge' pattern. 3. Financial loss indicates high urgency.",
  "action_items": ["Verify duplicate in payment gateway", "Issue refund for duplicate charge", "Send confirmation email"],
  "assigned_team": "Billing Support",
  "estimated_resolution_hours": 24
}

Input: "Suspicious logins from Russia — I didn't authorise them."
Output:
{
  "category": "Fraud-Security",
  "subcategory": "suspicious-login",
  "sentiment": "concerned",
  "urgency": "critical",
  "confidence": 0.95,
  "summary": "Customer reports unauthorised login attempts from foreign IPs.",
  "reasoning": "1. Foreign login location indicates possible account compromise. 2. No authorisation from customer = security incident. 3. Critical: financial data may be exposed.",
  "action_items": ["Force password reset", "Revoke all active sessions", "Notify security team", "Enable step-up auth"],
  "assigned_team": "Security Operations",
  "estimated_resolution_hours": 1
}
"""


class OllamaLLMEngine:
    def __init__(
        self,
        model: str = settings.ollama_llm_model,
        base_url: str = settings.ollama_host,
    ) -> None:
        self.model = model
        self._generate_url = f"{base_url}/api/generate"
        self._cache = get_query_cache()

    # ── Prompt Builders ───────────────────────────────────────────────────────

    def _build_user_prompt(self, complaint: str, chunks: List[Dict]) -> str:
        ctx_lines = []
        for i, c in enumerate(chunks, 1):
            cat = c.get("metadata", {}).get("category", "?")
            sub = c.get("metadata", {}).get("subcategory", "?")
            snippet = c["text"][:400]
            ctx_lines.append(f"[{i}] Category={cat}/{sub}\n    \"{snippet}\"")
        context_block = "\n\n".join(ctx_lines) if ctx_lines else "(no similar complaints found)"

        return f"""CUSTOMER COMPLAINT:
\"\"\"{complaint}\"\"\"

RETRIEVED SIMILAR COMPLAINTS:
{context_block}

Return ONLY the JSON classification object. No other text."""

    # ── Ollama Call with Retry ────────────────────────────────────────────────

    async def _call_ollama(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
            "stream": False,
            "format": "json",
            "options": {
                "temperature": settings.llm_temperature,
                "num_predict": settings.llm_max_tokens,
                "top_p": settings.llm_top_p,
            },
        }

        last_exc: Optional[Exception] = None
        for attempt in range(settings.ollama_max_retries):
            try:
                async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
                    resp = await client.post(self._generate_url, json=payload)
                    resp.raise_for_status()
                    return resp.json().get("response", "{}")
            except httpx.HTTPError as exc:
                last_exc = exc
                if attempt < settings.ollama_max_retries - 1:
                    jitter = random.uniform(0, 0.5)
                    wait = settings.ollama_retry_backoff * (2 ** attempt) + jitter
                    logger.warning(
                        "LLM call attempt %d/%d failed (%s). Retrying in %.1fs…",
                        attempt + 1, settings.ollama_max_retries, exc, wait,
                    )
                    await asyncio.sleep(wait)

        raise RuntimeError(f"Ollama unreachable after {settings.ollama_max_retries} attempts: {last_exc}")

    # ── JSON Extraction ───────────────────────────────────────────────────────

    @staticmethod
    def _extract_json(raw: str) -> Dict:
        """Three-tier JSON extraction: direct → strip fences → regex."""
        raw = raw.strip()

        # 1. Direct parse
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # 2. Strip markdown fences
        cleaned = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # 3. Regex: grab the outermost {...}
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not extract valid JSON from LLM output:\n{raw[:500]}")

    # ── Post-processing ───────────────────────────────────────────────────────

    @staticmethod
    def _coerce_fields(parsed: Dict) -> Dict:
        """
        Normalise common LLM output quirks before Pydantic validation.
        """
        # Flatten list-typed string fields
        for field in ("reasoning", "summary", "category", "subcategory", "assigned_team"):
            if field in parsed and isinstance(parsed[field], list):
                parsed[field] = " ".join(str(x) for x in parsed[field])

        # Ensure action_items is a list of strings
        if "action_items" in parsed:
            if isinstance(parsed["action_items"], str):
                parsed["action_items"] = [parsed["action_items"]]
            elif isinstance(parsed["action_items"], list):
                parsed["action_items"] = [str(x) for x in parsed["action_items"]]

        # Clamp confidence
        if "confidence" in parsed:
            try:
                parsed["confidence"] = max(0.0, min(1.0, float(parsed["confidence"])))
            except (TypeError, ValueError):
                parsed["confidence"] = 0.5

        # Normalise resolution hours
        if "estimated_resolution_hours" in parsed:
            try:
                parsed["estimated_resolution_hours"] = max(0, int(parsed["estimated_resolution_hours"]))
            except (TypeError, ValueError):
                parsed["estimated_resolution_hours"] = 24

        # Downgrade suspiciously perfect confidence on unknown categories
        if parsed.get("category") in ("Unknown", "unknown", None) and parsed.get("confidence", 1.0) > 0.5:
            parsed["confidence"] = min(parsed.get("confidence", 0.5), 0.5)

        return parsed

    # ── Query Expansion (Optional) ────────────────────────────────────────────

    async def expand_query(self, query: str, n: int = 3) -> List[str]:
        """
        Generate alternative phrasings of the query to improve retrieval recall.
        Returns original query + up to n expansions.
        Falls back gracefully if Ollama is slow/unavailable.
        """
        prompt = (
            f"Rewrite the following customer complaint in {n} alternative ways, "
            f"preserving meaning. Return ONLY a JSON array of strings.\n\n"
            f"Complaint: \"{query}\""
        )
        try:
            raw = await asyncio.wait_for(
                self._call_ollama(prompt),
                timeout=15.0,   # generous but bounded
            )
            parsed = self._extract_json(raw)
            if isinstance(parsed, list):
                expansions = [str(x) for x in parsed if isinstance(x, str)]
            elif isinstance(parsed, dict) and "expansions" in parsed:
                expansions = parsed["expansions"]
            else:
                return [query]
            return [query] + expansions[:n]
        except Exception as exc:
            logger.debug("Query expansion skipped: %s", exc)
            return [query]

    # ── Main Classify ─────────────────────────────────────────────────────────

    async def classify(
        self,
        complaint_text: str,
        retrieved_chunks: List[Dict],
    ) -> StructuredClassification:
        # Cache key: complaint text + sorted chunk IDs (order-insensitive)
        chunk_ids = sorted(c["id"] for c in retrieved_chunks)
        cache_key = make_cache_key("classify", complaint_text, chunk_ids)

        cached = self._cache.get(cache_key)
        if cached is not None:
            logger.debug("LLM classify cache hit")
            return cached

        user_prompt = self._build_user_prompt(complaint_text, retrieved_chunks)
        raw_output = await self._call_ollama(user_prompt)

        try:
            parsed = self._extract_json(raw_output)
        except ValueError as exc:
            logger.error("JSON extraction failed: %s", exc)
            return self._fallback_classification()

        parsed = self._coerce_fields(parsed)

        try:
            result = StructuredClassification(**parsed)
        except Exception as exc:
            logger.error("Pydantic validation failed: %s | parsed=%s", exc, parsed)
            return self._fallback_classification()

        self._cache.set(cache_key, result)
        return result

    # ── Fallback ──────────────────────────────────────────────────────────────

    @staticmethod
    def _fallback_classification() -> StructuredClassification:
        return StructuredClassification(
            category="Unknown",
            subcategory="parse-error",
            sentiment="neutral",
            urgency="medium",
            confidence=0.0,
            summary="Classification failed — manual review required.",
            reasoning="LLM returned unparseable output.",
            action_items=["Route to human agent for manual triage"],
            assigned_team="Manual Review",
            estimated_resolution_hours=48,
            escalate_to_human=True,
        )