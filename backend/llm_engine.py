"""
llm_engine.py v2 — Robust Ollama LLM client with few-shot refresh support.

New vs v1:
  • _few_shot_block attribute patched by FewShotRefresher at runtime (Enh. 5)
  • _build_prompt() merges base system prompt + live few-shot block
  • Prometheus timing via metrics.time_llm() (Enh. 3)
  • All retry / cache / JSON extraction logic preserved from v1
"""
from __future__ import annotations
import asyncio
import json
import logging
import random
import re
import httpx
from cache import get_query_cache, make_cache_key
from config import settings
from models import StructuredClassification

logger = logging.getLogger(__name__)

BASE_SYSTEM_PROMPT = """You are an expert Customer Support Intelligence analyst.
You MUST respond with valid JSON only. No markdown, no preamble.

Categories: Billing, Technical, Account, Product-Quality, Shipping, Service, Fraud-Security, Unknown
Urgency rules:
  critical → security breach / account locked with financial exposure
  high     → financial loss, service completely broken, imminent deadline
  medium   → inconvenience, partial failure, delayed refund
  low      → cosmetic issue, feedback, promo code failure

FEW-SHOT EXAMPLES:
Input: "I was charged twice — $49.99 appears twice on my statement."
{"category":"Billing","subcategory":"double-charge","sentiment":"frustrated","urgency":"high","confidence":0.97,"summary":"Duplicate subscription charge — refund required.","reasoning":"1. 'charged twice' matches double-charge pattern. 2. Financial loss = high urgency.","action_items":["Verify duplicate in payment gateway","Issue refund","Send confirmation"],"assigned_team":"Billing Support","estimated_resolution_hours":24}

Input: "Suspicious logins from Russia — I didn't authorise them."
{"category":"Fraud-Security","subcategory":"suspicious-login","sentiment":"concerned","urgency":"critical","confidence":0.95,"summary":"Unauthorised login attempts from foreign IPs.","reasoning":"1. Foreign IP = possible compromise. 2. No auth from customer = security incident.","action_items":["Force password reset","Revoke sessions","Notify security team"],"assigned_team":"Security Operations","estimated_resolution_hours":1}
"""


class OllamaLLMEngine:
    def __init__(self, model=None, base_url=None):
        self.model              = model    or settings.ollama_llm_model
        self._generate_url      = (base_url or settings.ollama_host) + "/api/generate"
        self._cache             = get_query_cache()
        self._base_system_prompt = BASE_SYSTEM_PROMPT
        self._few_shot_block: str = ""   # patched by FewShotRefresher

    # ── Prompt ────────────────────────────────────────────────────────────────
    def _build_system_prompt(self):
        """Merge base prompt + live few-shot block injected by the refresher."""
        return self._base_system_prompt + self._few_shot_block

    def _build_user_prompt(self, complaint, chunks):
        ctx = "\n\n---\n\n".join(
            f"[{i+1}] Cat={c.get('metadata',{}).get('category','?')}  \"{c['text'][:400]}\""
            for i, c in enumerate(chunks)
        ) or "(no context)"
        return (f"COMPLAINT:\n\"\"\"{complaint}\"\"\"\n\n"
                f"SIMILAR COMPLAINTS:\n{ctx}\n\nReturn ONLY strict JSON:")

    # ── Ollama call ───────────────────────────────────────────────────────────
    async def _call_ollama(self, prompt):
        payload = {
            "model": self.model,
            "prompt": f"{self._build_system_prompt()}\n\n{prompt}",
            "stream": False, "format": "json",
            "options": {"temperature": settings.llm_temperature,
                        "num_predict": settings.llm_max_tokens,
                        "top_p": settings.llm_top_p},
        }
        last = None
        for attempt in range(settings.ollama_max_retries):
            try:
                async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as c:
                    resp = await c.post(self._generate_url, json=payload)
                    resp.raise_for_status()
                    return resp.json().get("response", "{}")
            except httpx.HTTPError as exc:
                last = exc
                if attempt < settings.ollama_max_retries - 1:
                    await asyncio.sleep(
                        settings.ollama_retry_backoff * (2**attempt) + random.uniform(0, 0.5))
        raise RuntimeError(f"Ollama unreachable after {settings.ollama_max_retries} attempts: {last}")

    # ── JSON extraction ───────────────────────────────────────────────────────
    @staticmethod
    def _extract_json(raw):
        raw = raw.strip()
        try: return json.loads(raw)
        except json.JSONDecodeError: pass
        cleaned = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
        try: return json.loads(cleaned)
        except json.JSONDecodeError: pass
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try: return json.loads(m.group())
            except json.JSONDecodeError: pass
        raise ValueError(f"No JSON in LLM output: {raw[:300]}")

    @staticmethod
    def _coerce(parsed):
        for f in ("reasoning","summary","category","subcategory","assigned_team"):
            if f in parsed and isinstance(parsed[f], list):
                parsed[f] = " ".join(str(x) for x in parsed[f])
        if "action_items" in parsed:
            if isinstance(parsed["action_items"], str):
                parsed["action_items"] = [parsed["action_items"]]
        if "confidence" in parsed:
            try: parsed["confidence"] = max(0.0, min(1.0, float(parsed["confidence"])))
            except: parsed["confidence"] = 0.5
        if "estimated_resolution_hours" in parsed:
            try: parsed["estimated_resolution_hours"] = max(0, int(parsed["estimated_resolution_hours"]))
            except: parsed["estimated_resolution_hours"] = 24
        if parsed.get("category") in ("Unknown","unknown",None):
            parsed["confidence"] = min(parsed.get("confidence", 0.5), 0.5)
        return parsed

    # ── Main classify ─────────────────────────────────────────────────────────
    async def classify(self, complaint_text, retrieved_chunks):
        chunk_ids = sorted(c["id"] for c in retrieved_chunks)
        key = make_cache_key("classify", complaint_text, chunk_ids, self._few_shot_block[:50])
        cached = self._cache.get(key)
        if cached: return cached

        prompt = self._build_user_prompt(complaint_text, retrieved_chunks)
        try:
            from metrics import metrics
            with metrics.time_llm(self.model):
                raw = await self._call_ollama(prompt)
        except Exception:
            raw = await self._call_ollama(prompt)

        try:
            parsed = self._extract_json(raw)
        except ValueError as exc:
            logger.error("JSON extraction failed: %s", exc)
            return self._fallback()

        parsed = self._coerce(parsed)
        try:
            result = StructuredClassification(**parsed)
        except Exception as exc:
            logger.error("Pydantic validation failed: %s | %s", exc, parsed)
            return self._fallback()

        self._cache.set(key, result)

        # Prometheus
        try:
            from metrics import metrics
            metrics.record_classification(result.category, result.urgency)
        except Exception: pass

        return result

    @staticmethod
    def _fallback():
        return StructuredClassification(
            category="Unknown", subcategory="parse-error",
            sentiment="neutral", urgency="medium", confidence=0.0,
            summary="Classification failed — manual review required.",
            reasoning="LLM returned unparseable output.",
            action_items=["Route to human agent"],
            assigned_team="Manual Review", estimated_resolution_hours=48,
            escalate_to_human=True,
        )