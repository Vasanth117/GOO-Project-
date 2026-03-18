from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    MISSION_COMPLETE = "mission_complete"
    MISSION_EXPIRED = "mission_expired"
    BADGE_EARNED = "badge_earned"
    STREAK_MILESTONE = "streak_milestone"
    STREAK_BROKEN = "streak_broken"
    SCORE_DECAY = "score_decay"
    WEATHER_ALERT = "weather_alert"
    PROOF_APPROVED = "proof_approved"
    PROOF_REJECTED = "proof_rejected"
    COMMUNITY_VERIFIED = "community_verified"
    NEW_FOLLOWER = "new_follower"
    POST_COMMENT = "post_comment"
    POST_LIKE = "post_like"
    GRC_INVITATION = "grc_invitation"
    ORDER_PLACED = "order_placed"
    ORDER_RECEIVED = "order_received"
    REWARD_UNLOCKED = "reward_unlocked"
    REWARD_REDEEMED = "reward_redeemed"
    SYSTEM = "system"


class Notification(Document):
    user_id: str
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None      # deep link e.g. "/missions/123"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
