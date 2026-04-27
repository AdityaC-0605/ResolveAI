from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from enum import Enum

class UrgencyLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Sentiment(str, Enum):
    ANGRY = "angry"
    FRUSTRATED = "frustrated"
    NEUTRAL = "neutral"
    CONCERNED = "concerned"

class ComplaintInput(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000, description="Raw complaint text")
    customer_id: Optional[str] = Field(None, description="Optional customer identifier")
    source: Optional[str] = Field("web", description="Source channel")

class RetrievedChunk(BaseModel):
    id: str
    text: str
    source: str
    score: float
    rank: int
    retrieval_method: Literal["keyword", "semantic", "fused"]

class StructuredClassification(BaseModel):
    category: str = Field(..., description="Primary complaint category")
    subcategory: str = Field(..., description="Specific subcategory")
    sentiment: Sentiment = Field(..., description="Detected customer sentiment")
    urgency: UrgencyLevel = Field(..., description="Priority level")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    summary: str = Field(..., description="Concise 1-2 sentence summary")
    reasoning: str = Field(..., description="Step-by-step classification reasoning")
    action_items: List[str] = Field(default_factory=list, description="Recommended actions")
    assigned_team: str = Field(..., description="Team to route to")
    estimated_resolution_hours: int = Field(..., ge=0, description="ETA for resolution")
    metadata: dict = Field(default_factory=dict)

class ClassificationResponse(BaseModel):
    complaint_id: str
    input_text: str
    processing_time_ms: float
    retrieved_chunks: List[RetrievedChunk]
    classification: StructuredClassification
    hybrid_scores: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)