"""
models.py — All Pydantic v2 request/response schemas.

Design decisions:
- Enums enforce valid values at the boundary so invalid data never reaches the LLM layer.
- ClassificationResponse embeds a FusionDebugInfo sub-model instead of a raw dict
  to give clients a stable, documented contract.
- FeedbackRequest is separate so it can evolve independently.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ── Domain Enums ──────────────────────────────────────────────────────────────

class Category(str, Enum):
    BILLING        = "Billing"
    TECHNICAL      = "Technical"
    ACCOUNT        = "Account"
    PRODUCT        = "Product-Quality"
    SHIPPING       = "Shipping"
    SERVICE        = "Service"
    FRAUD_SECURITY = "Fraud-Security"
    UNKNOWN        = "Unknown"


class UrgencyLevel(str, Enum):
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"


class Sentiment(str, Enum):
    ANGRY      = "angry"
    FRUSTRATED = "frustrated"
    NEUTRAL    = "neutral"
    CONCERNED  = "concerned"


# ── Request Models ────────────────────────────────────────────────────────────

class ComplaintInput(BaseModel):
    text: str = Field(
        ...,
        min_length=5,
        max_length=5_000,
        description="Raw complaint text",
        examples=["I was charged twice for my subscription this month!"],
    )
    customer_id: Optional[str] = Field(None, description="Optional customer identifier")
    source: Optional[str] = Field("web", description="Originating channel (web/email/chat)")
    language: Optional[str] = Field("en", description="ISO-639-1 language code")

    @field_validator("text")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class BatchComplaintInput(BaseModel):
    complaints: List[ComplaintInput] = Field(
        ..., min_length=1, max_length=50, description="Up to 50 complaints per batch"
    )


class DocumentUpsert(BaseModel):
    id: str = Field(..., description="Unique document ID")
    text: str = Field(..., min_length=10, description="Document content")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FeedbackRequest(BaseModel):
    complaint_id: str
    correct_category: Optional[str] = None
    correct_urgency: Optional[UrgencyLevel] = None
    is_correct: bool = Field(..., description="Was the classification correct?")
    reviewer_note: Optional[str] = Field(None, max_length=500)


# ── Sub-models ────────────────────────────────────────────────────────────────

class RetrievedChunk(BaseModel):
    id: str
    text: str
    source: str
    score: float
    rank: int
    retrieval_method: Literal["keyword", "semantic", "fused"]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FusionDebugInfo(BaseModel):
    keyword_hits: int
    semantic_hits: int
    fused_hits: int
    keyword_top_score: float
    semantic_top_score: float
    reranked: bool = False


class StructuredClassification(BaseModel):
    category: str = Field(..., description="Primary complaint category")
    subcategory: str = Field(..., description="Specific subcategory")
    sentiment: str = Field(..., description="Detected customer sentiment")
    urgency: str = Field(..., description="Priority level")
    confidence: float = Field(..., ge=0.0, le=1.0)
    summary: str = Field(..., description="1-2 sentence summary")
    reasoning: str = Field(..., description="Step-by-step reasoning")
    action_items: List[str] = Field(default_factory=list)
    assigned_team: str
    estimated_resolution_hours: int = Field(..., ge=0)
    escalate_to_human: bool = Field(
        False,
        description="True when confidence < threshold or urgency is critical",
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def set_escalation(self) -> "StructuredClassification":
        if self.confidence < 0.6 or self.urgency == "critical":
            self.escalate_to_human = True
        return self


# ── Response Models ───────────────────────────────────────────────────────────

class ClassificationResponse(BaseModel):
    complaint_id: str
    input_text: str
    processing_time_ms: float
    retrieved_chunks: List[RetrievedChunk]
    classification: StructuredClassification
    hybrid_scores: FusionDebugInfo
    cached: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class BatchClassificationResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[ClassificationResponse | Dict[str, str]]  # dict = error entry
    processing_time_ms: float


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    vector_db_count: int
    ollama_reachable: bool
    bm25_index_ready: bool
    cache_hit_rate: float
    uptime_seconds: float


class StatsResponse(BaseModel):
    total_documents: int
    total_classifications: int
    cache_hits: int
    cache_misses: int
    avg_processing_ms: float
    index_status: str
    embedding_model: str
    llm_model: str
    fusion_method: str
    keyword_weight: float
    semantic_weight: float


class FeedbackResponse(BaseModel):
    accepted: bool
    message: str