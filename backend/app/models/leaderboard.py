from beanie import Document
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from enum import Enum


class LeaderboardType(str, Enum):
    LOCAL = "local"
    DISTRICT = "district"
    NATIONAL = "national"
    STREAKS = "streaks"
    WATER_SAVERS = "water_savers"
    MISSION_CHAMPIONS = "mission_champions"


class LeaderboardEntry(BaseModel):
    rank: int
    farmer_id: str
    farmer_name: str
    score: int
    badge_tier: str


class Leaderboard(Document):
    type: LeaderboardType
    region: str = "all"   # district name or "all"
    entries: List[LeaderboardEntry] = []
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "leaderboards"
