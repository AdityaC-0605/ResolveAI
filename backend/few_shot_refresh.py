"""
few_shot_refresh.py — Feedback-driven prompt refresh

Enhancement 5: Feedback-Driven Few-Shot Refresh
─────────────────────────────────────────────────
Closes the human-in-the-loop cycle without fine-tuning:

  Every REFRESH_INTERVAL_HOURS (default 6h) the scheduler:
    1. Queries feedback.get_misclassified() for recent corrections
    2. Formats each correction as a (complaint → correct JSON) few-shot example
    3. Patches the system prompt used by OllamaLLMEngine
    4. Optionally persists the new prompt to few_shot_cache.json for restart
       persistence (no DB migration required)
    5. Clears the LLM result cache so the next requests use the fresh prompt

Why this matters
  Large language models are highly sensitive to in-context examples. Even 3-4
  well-chosen corrections in the system prompt can raise classification accuracy
  by 5-10 points on the categories that were most often wrong — with zero GPU
  training cost.

Quality guards
  • Only examples with explicit human corrections (correct_cat / correct_urg set)
    are used — thumbs-down without a correction is ignored.
  • Maximum MAX_EXAMPLES few-shot examples are kept; oldest are dropped first.
  • Examples are deduplicated by complaint_id.
  • A diversity check prevents over-fitting to one category.

How to trigger manually
  POST /admin/refresh-prompts  (added to main.py)

How to view current examples
  GET /admin/few-shot-examples
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import TYPE_CHECKING, List, Optional


if TYPE_CHECKING:
    from feedback import FeedbackStore
    from llm_engine import OllamaLLMEngine

logger = logging.getLogger(__name__)

MAX_EXAMPLES        = 8       # max few-shot examples in system prompt
REFRESH_INTERVAL_H  = 6       # hours between automatic refreshes
MAX_SAME_CATEGORY   = 2       # diversity: at most N examples per category
CACHE_FILE          = Path("few_shot_cache.json")


# ── Formatter ─────────────────────────────────────────────────────────────────

def format_example(record: dict) -> Optional[str]:
    """
    Turn a misclassified feedback row into a few-shot example string.
    Returns None if the record lacks the minimum required fields.
    """
    text = (record.get("input_text") or "").strip()
    cat  = record.get("correct_cat")
    urg  = record.get("correct_urg")

    if not text or not cat:
        return None

    # Build a partial ground-truth JSON — only fields we have corrections for
    correction: dict = {"category": cat}
    if urg:
        correction["urgency"] = urg

    return (
        f'Input: "{text[:300]}{"…" if len(text) > 300 else ""}"\n'
        f"Correct classification (human-verified):\n"
        f"{json.dumps(correction, indent=2)}"
    )


def build_few_shot_block(examples: List[str]) -> str:
    """Wrap formatted examples in a labelled block for the system prompt."""
    if not examples:
        return ""
    lines = [
        "\n\nHUMAN-VERIFIED CORRECTION EXAMPLES (highest priority — follow these exactly):",
        "─" * 60,
    ]
    for i, ex in enumerate(examples, 1):
        lines.append(f"\n[Correction {i}]\n{ex}")
    lines.append("─" * 60)
    return "\n".join(lines)


def select_diverse_examples(records: List[dict], max_total: int = MAX_EXAMPLES) -> List[dict]:
    """
    Choose up to max_total records while enforcing per-category diversity
    so the prompt doesn't get dominated by one complaint type.
    """
    seen_ids: set = set()
    category_count: Counter = Counter()
    selected = []

    # Sort by most recent first
    sorted_records = sorted(records, key=lambda r: r.get("created_at", ""), reverse=True)

    for r in sorted_records:
        if len(selected) >= max_total:
            break
        cid = r.get("complaint_id", "")
        cat = r.get("correct_cat", "Unknown")

        if cid in seen_ids:
            continue
        if category_count[cat] >= MAX_SAME_CATEGORY:
            continue

        seen_ids.add(cid)
        category_count[cat] += 1
        selected.append(r)

    return selected


# ── Refresher ─────────────────────────────────────────────────────────────────

class FewShotRefresher:
    """
    Holds a reference to the live LLM engine and patches its system prompt
    based on feedback corrections from the FeedbackStore.
    """

    def __init__(
        self,
        feedback_store: "FeedbackStore",
        llm_engine: "OllamaLLMEngine",
    ) -> None:
        self._feedback    = feedback_store
        self._llm         = llm_engine
        self._last_refresh: Optional[datetime] = None
        self._current_examples: List[str] = self._load_cached_examples()
        self._apply_examples(self._current_examples, log=False)

    # ── Public API ────────────────────────────────────────────────────────────

    async def refresh(self, force: bool = False) -> dict:
        """
        Run a refresh cycle. Returns a summary dict.
        Safe to call from an HTTP handler or the background task.
        """
        if not force and self._last_refresh:
            elapsed = datetime.utcnow() - self._last_refresh
            if elapsed < timedelta(hours=REFRESH_INTERVAL_H):
                return {
                    "refreshed": False,
                    "reason": f"Last refresh was {elapsed.seconds // 60}m ago (interval={REFRESH_INTERVAL_H}h)",
                    "examples_active": len(self._current_examples),
                }

        logger.info("Few-shot refresh starting…")
        misclassified = self._feedback.get_misclassified(limit=100)

        if not misclassified:
            self._last_refresh = datetime.utcnow()
            return {"refreshed": False, "reason": "No corrections in feedback store.", "examples_active": 0}

        selected  = select_diverse_examples(misclassified)
        examples  = [fmt for r in selected if (fmt := format_example(r))]

        if not examples:
            return {"refreshed": False, "reason": "No usable corrections (missing correct_cat).", "examples_active": 0}

        self._current_examples = examples
        self._apply_examples(examples)
        self._save_cached_examples(examples)
        self._last_refresh = datetime.utcnow()

        # Bust the LLM cache so next requests pick up the new prompt
        from cache import get_query_cache
        get_query_cache().clear()

        logger.info(
            "Few-shot refresh complete — %d examples active (categories: %s)",
            len(examples),
            {r.get("correct_cat") for r in selected},
        )
        return {
            "refreshed": True,
            "examples_active": len(examples),
            "categories_covered": list({r.get("correct_cat") for r in selected}),
            "cache_cleared": True,
        }

    async def run_background_loop(self) -> None:
        """Async task that refreshes on a fixed interval. Run with asyncio.create_task()."""
        logger.info("Few-shot background refresh loop started (interval=%dh)", REFRESH_INTERVAL_H)
        while True:
            await asyncio.sleep(REFRESH_INTERVAL_H * 3600)
            try:
                result = await self.refresh(force=True)
                logger.info("Background few-shot refresh: %s", result)
            except Exception as exc:
                logger.error("Background few-shot refresh failed: %s", exc)

    @property
    def active_examples(self) -> List[str]:
        return list(self._current_examples)

    @property
    def last_refresh_iso(self) -> Optional[str]:
        return self._last_refresh.isoformat() if self._last_refresh else None

    # ── Internal ──────────────────────────────────────────────────────────────

    def _apply_examples(self, examples: List[str], log: bool = True) -> None:
        """Patch the live LLM engine's system prompt in-place."""
        block = build_few_shot_block(examples)
        # OllamaLLMEngine exposes _base_system_prompt (set during __init__)
        # We store the original once and always append the current block to it.
        if not hasattr(self._llm, "_base_system_prompt"):
            self._llm._base_system_prompt = self._llm._build_system_prompt()  # type: ignore[attr-defined]

        self._llm._few_shot_block = block  # type: ignore[attr-defined]
        if log:
            logger.info("System prompt patched with %d few-shot examples.", len(examples))

    def _save_cached_examples(self, examples: List[str]) -> None:
        try:
            CACHE_FILE.write_text(
                json.dumps({"updated_at": datetime.utcnow().isoformat(), "examples": examples}, indent=2)
            )
        except Exception as exc:
            logger.warning("Could not persist few-shot cache: %s", exc)

    def _load_cached_examples(self) -> List[str]:
        try:
            if CACHE_FILE.exists():
                data = json.loads(CACHE_FILE.read_text())
                examples = data.get("examples", [])
                logger.info("Loaded %d cached few-shot examples from %s", len(examples), CACHE_FILE)
                return examples
        except Exception as exc:
            logger.warning("Could not load few-shot cache: %s", exc)
        return []


# ── Singleton ─────────────────────────────────────────────────────────────────

_refresher: Optional[FewShotRefresher] = None


def get_refresher() -> Optional[FewShotRefresher]:
    return _refresher


def init_refresher(feedback_store, llm_engine) -> FewShotRefresher:
    global _refresher
    _refresher = FewShotRefresher(feedback_store, llm_engine)
    return _refresher