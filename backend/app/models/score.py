from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum


class ScoreChangeReason(str, Enum):
    MISSION_COMPLETE = "mission_complete"
    STREAK_BONUS = "streak_bonus"
    COMMUNITY_VERIFIED = "community_verified"
    EXPERT_APPROVED = "expert_approved"
    WATER_SAVING = "water_saving"
    ORGANIC_FERTILIZER = "organic_fertilizer"
    CHEMICAL_USAGE = "chemical_usage"
    INACTIVITY_DECAY = "inactivity_decay"
    FRAUD_PENALTY = "fraud_penalty"
    PROOF_REJECTED = "proof_rejected"
    BADGE_BONUS = "badge_bonus"
    CHECKIN_BONUS = "checkin_bonus"


class ScoreLog(Document):
    farmer_id: str
    delta: int            # positive = gain, negative = loss
    reason: ScoreChangeReason
    description: str
    score_before: int
    score_after: int
    logged_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "score_logs"
