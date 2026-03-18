from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class GRCMember(Document):
    farmer_id: str
    invited_by: str       # Admin ID
    accepted_at: datetime = Field(default_factory=datetime.utcnow)
    verifications_count: int = 0
    is_active: bool = True

    class Settings:
        name = "grc_members"
