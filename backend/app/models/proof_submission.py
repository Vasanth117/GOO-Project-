from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ProofStatus(str, Enum):
    PENDING_AI = "pending_ai"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProofMetadata(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    device_id: Optional[str] = None
    file_hash: Optional[str] = None  # For duplicate detection


class AIAnalysisResult(BaseModel):
    is_real_farm: bool = False
    confidence_score: float = 0.0
    crop_health_valid: bool = False
    manipulation_detected: bool = False
    analysis_notes: str = ""


class ProofSubmission(Document):
    farmer_id: str           # references User._id
    mission_progress_id: str # references MissionProgress._id
    file_url: str            # stored file path/URL
    file_type: str           # "image" or "video"
    metadata: ProofMetadata
    status: ProofStatus = ProofStatus.PENDING_AI
    ai_result: Optional[AIAnalysisResult] = None
    reviewer_id: Optional[str] = None     # Expert/GRC who reviewed
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "proof_submissions"
