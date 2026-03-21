from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class MissionStatus(str, Enum):
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    EXPIRED = "expired"
    REJECTED = "rejected"


class MissionProgress(Document):
    farmer_id: str           # references User._id
    mission_id: str          # references Mission._id
    status: MissionStatus = MissionStatus.ACTIVE
    proof_submission_id: Optional[str] = None  # references ProofSubmission._id
    points_earned: int = 0
    progress_percentage: int = 0
    current_step: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: datetime
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "mission_progress"
