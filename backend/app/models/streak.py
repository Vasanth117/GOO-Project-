from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class Streak(Document):
    farmer_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    streak_broken_count: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "streaks"
