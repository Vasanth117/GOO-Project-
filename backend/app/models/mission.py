from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MissionType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    LONG_TERM = "long_term"
    COMMUNITY = "community"
    SURPRISE = "surprise"


class MissionDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ProofRequirement(BaseModel):
    requires_photo: bool = True
    requires_video: bool = False
    requires_gps: bool = True
    description: str = "Upload a photo as proof"


class Mission(Document):
    title: str
    description: str
    mission_type: MissionType
    difficulty: MissionDifficulty = MissionDifficulty.EASY
    reward_points: int = 10
    proof_requirement: ProofRequirement = Field(default_factory=ProofRequirement)
    target_roles: List[str] = ["farmer"]
    target_score_min: Optional[int] = None
    target_score_max: Optional[int] = None
    target_region: Optional[str] = None  # GPS-based targeting
    duration_hours: int = 24  # how long farmer has to complete
    eco_benefit: str = "Reduces environmental impact"
    next_step: str = "Follow instructions to complete"
    personalization_tag: Optional[str] = None # e.g. "Recommended for your soil"
    
    # Community specific
    participants_count: int = 0
    scope: str = "Local" # Local, District, National
    goal_text: Optional[str] = None
    
    is_active: bool = True
    created_by: str = "system"  # "system" or admin user ID
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "missions"
