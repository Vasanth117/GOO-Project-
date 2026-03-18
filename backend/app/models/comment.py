from beanie import Document
from pydantic import Field
from datetime import datetime


class Comment(Document):
    post_id: str
    author_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "comments"


class Reaction(Document):
    """Tracks likes on posts."""
    post_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reactions"


class Follow(Document):
    """Follower relationship between users."""
    follower_id: str   # user who is following
    following_id: str  # user being followed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "follows"
