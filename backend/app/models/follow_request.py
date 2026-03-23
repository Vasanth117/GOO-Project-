from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum


class FollowRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class FollowRequest(Document):
    from_user_id: str  # Referencer
    to_user_id: str    # Target (private user)
    status: FollowRequestStatus = FollowRequestStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "follow_requests"
