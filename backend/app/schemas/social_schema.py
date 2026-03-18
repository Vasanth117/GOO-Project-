from pydantic import BaseModel, Field
from typing import Optional, List


# ─── REQUEST SCHEMAS ─────────────────────────────────────────

class CreatePostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    tags: List[str] = []
    mission_progress_id: Optional[str] = None  # link to a completed mission

    class Config:
        json_schema_extra = {
            "example": {
                "content": "Just completed my 7-day water saving mission! 💧 My crops are thriving with drip irrigation.",
                "tags": ["watersaving", "drip", "organic"]
            }
        }


class CreateCommentRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)


class GRCVerifyRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {"decision": "approve", "notes": "Verified organic practices in person"}
        }


# ─── RESPONSE SCHEMAS ────────────────────────────────────────

class AuthorInfo(BaseModel):
    id: str
    name: str
    role: str
    profile_picture: Optional[str]
    score_tier: Optional[str]


class PostResponse(BaseModel):
    id: str
    author: AuthorInfo
    content: str
    image_url: Optional[str]
    video_url: Optional[str]
    tags: List[str]
    likes_count: int
    comments_count: int
    is_verified_post: bool
    is_liked_by_me: bool
    mission_progress_id: Optional[str]
    created_at: str


class CommentResponse(BaseModel):
    id: str
    author: AuthorInfo
    content: str
    created_at: str


class ProfileResponse(BaseModel):
    id: str
    name: str
    role: str
    bio: Optional[str]
    profile_picture: Optional[str]
    sustainability_score: Optional[int]
    score_tier: Optional[str]
    badges_count: int
    posts_count: int
    followers_count: int
    following_count: int
    is_following: bool
    is_grc_member: bool
    joined_at: str
