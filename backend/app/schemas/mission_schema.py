from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.mission import MissionType, MissionDifficulty


# ─── REQUEST SCHEMAS ─────────────────────────────────────────

class CreateMissionRequest(BaseModel):
    """Admin: create a mission template."""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    mission_type: MissionType
    difficulty: MissionDifficulty = MissionDifficulty.EASY
    reward_points: int = Field(default=10, ge=1, le=500)
    requires_photo: bool = True
    requires_video: bool = False
    requires_gps: bool = True
    proof_description: str = "Upload a photo as proof"
    duration_hours: int = Field(default=24, ge=1, le=720)
    target_score_min: Optional[int] = None
    target_score_max: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Use Drip Irrigation Today",
                "description": "Water your crops using drip irrigation instead of flood irrigation.",
                "mission_type": "daily",
                "difficulty": "easy",
                "reward_points": 10,
                "requires_photo": True,
                "proof_description": "Upload a photo of your drip irrigation system in use",
                "duration_hours": 24,
            }
        }


class ReviewProofRequest(BaseModel):
    """Expert/GRC: approve or reject a submitted proof."""
    decision: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {"decision": "approve", "notes": "Crop health looks good, valid drip system visible"}
        }


# ─── RESPONSE SCHEMAS ────────────────────────────────────────

class MissionTemplateResponse(BaseModel):
    id: str
    title: str
    description: str
    mission_type: str
    difficulty: str
    reward_points: int
    requires_photo: bool
    proof_description: str
    duration_hours: int
    created_by: str
    created_at: str


class MissionProgressResponse(BaseModel):
    progress_id: str
    mission_id: str
    title: str
    description: str
    mission_type: str
    difficulty: str
    reward_points: int
    requires_photo: bool
    proof_description: str
    status: str
    proof_submission_id: Optional[str]
    points_earned: int
    assigned_at: str
    started_at: Optional[str]
    expires_at: str
    completed_at: Optional[str]


class MissionHistoryResponse(BaseModel):
    total_completed: int
    total_expired: int
    total_points_earned: int
    missions: List[MissionProgressResponse]
