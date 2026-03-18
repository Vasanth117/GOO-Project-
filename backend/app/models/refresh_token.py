from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class RefreshToken(Document):
    user_id: str
    token: str
    expires_at: datetime
    is_revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "refresh_tokens"
