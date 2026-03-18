from beanie import Document
from pydantic import Field
from datetime import datetime


class Follow(Document):
    follower_id: str
    following_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "follows"
