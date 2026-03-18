from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime


class Post(Document):
    author_id: str
    content: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    mission_progress_id: Optional[str] = None  # if this is a mission completion post
    tags: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    is_verified_post: bool = False  # True if proof was AI-verified
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "posts"
