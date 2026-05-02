"""
feedback.py — Persistent feedback store using SQLite (zero extra dependencies).

Feedback is used for:
  1. Offline accuracy analysis
  2. Active-learning-style re-labelling queue
  3. Gradual fine-tuning / few-shot example curation

Schema is intentionally simple — migrate to Postgres for multi-instance deployments.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Dict, List, Optional

from config import settings

logger = logging.getLogger(__name__)


class FeedbackStore:
    def __init__(self, db_path: str = settings.feedback_db_path) -> None:
        self._path = db_path
        self._init_db()

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(self._path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS feedback (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    complaint_id  TEXT    NOT NULL,
                    is_correct    BOOLEAN NOT NULL,
                    correct_cat   TEXT,
                    correct_urg   TEXT,
                    reviewer_note TEXT,
                    created_at    TEXT    NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS classifications (
                    complaint_id    TEXT    PRIMARY KEY,
                    input_text      TEXT    NOT NULL,
                    classification  TEXT    NOT NULL,   -- JSON blob
                    created_at      TEXT    NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_feedback_complaint ON feedback(complaint_id)")

    # ── Write ─────────────────────────────────────────────────────────────────

    def save_classification(self, complaint_id: str, input_text: str, classification: Dict) -> None:
        with self._conn() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO classifications (complaint_id, input_text, classification, created_at)
                   VALUES (?, ?, ?, ?)""",
                (complaint_id, input_text, json.dumps(classification), datetime.utcnow().isoformat()),
            )

    def add_feedback(
        self,
        complaint_id: str,
        is_correct: bool,
        correct_category: Optional[str] = None,
        correct_urgency: Optional[str] = None,
        reviewer_note: Optional[str] = None,
    ) -> int:
        with self._conn() as conn:
            cur = conn.execute(
                """INSERT INTO feedback
                       (complaint_id, is_correct, correct_cat, correct_urg, reviewer_note, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    complaint_id,
                    is_correct,
                    correct_category,
                    correct_urgency,
                    reviewer_note,
                    datetime.utcnow().isoformat(),
                ),
            )
            return cur.lastrowid

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_accuracy(self, limit: int = 1000) -> Dict:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT is_correct FROM feedback ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        if not rows:
            return {"total": 0, "correct": 0, "accuracy": None}
        total = len(rows)
        correct = sum(1 for r in rows if r["is_correct"])
        return {"total": total, "correct": correct, "accuracy": round(correct / total, 4)}

    def get_misclassified(self, limit: int = 100) -> List[Dict]:
        """Return feedback rows where the LLM was wrong — useful for few-shot curation."""
        with self._conn() as conn:
            rows = conn.execute(
                """SELECT f.*, c.input_text, c.classification
                   FROM feedback f
                   LEFT JOIN classifications c ON c.complaint_id = f.complaint_id
                   WHERE f.is_correct = 0
                   ORDER BY f.created_at DESC
                   LIMIT ?""",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_stats(self) -> Dict:
        with self._conn() as conn:
            total_fb = conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
            total_cls = conn.execute("SELECT COUNT(*) FROM classifications").fetchone()[0]
        acc = self.get_accuracy()
        return {
            "total_classifications": total_cls,
            "total_feedback": total_fb,
            **acc,
        }