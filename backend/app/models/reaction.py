from beanie import Document
from pydantic import Field
from datetime import datetime


class Reaction(Document):
    post_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reactions"
