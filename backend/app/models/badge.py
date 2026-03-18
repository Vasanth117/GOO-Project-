from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BadgeTier(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    SPECIAL = "special"


class BadgeDefinition(Document):
    """Template: defines conditions to earn a badge."""
    code: str               # unique identifier e.g. "water_saver"
    name: str               # display name e.g. "Water Saver"
    description: str
    icon: str               # emoji or icon name
    tier: BadgeTier
    condition_type: str     # "score_threshold" | "streak" | "missions" | "practice_days"
    condition_value: int    # the threshold value
    reward_points: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "badge_definitions"


class FarmerBadge(Document):
    """Records a badge earned by a specific farmer."""
    farmer_id: str
    badge_code: str         # references BadgeDefinition.code
    badge_name: str
    badge_icon: str
    badge_tier: BadgeTier
    earned_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "farmer_badges"
