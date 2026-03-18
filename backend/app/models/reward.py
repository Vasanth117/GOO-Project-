from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RewardType(str, Enum):
    VOUCHER = "voucher"
    EQUIPMENT = "equipment"
    BADGE = "badge"
    OTHER = "other"


class Reward(Document):
    farmer_id: str
    reward_type: RewardType = RewardType.VOUCHER
    points_cost: int = 0
    description: str = ""
    metadata: Optional[dict] = {}
    is_redeemed: bool = False
    redeemed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "rewards"
