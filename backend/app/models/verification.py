from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class VerificationStatus(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


class Verification(Document):
    farm_id: str
    verifier_id: str       # GRC member or Expert
    verifier_role: str     # "grc" or "expert"
    status: VerificationStatus
    notes: Optional[str] = None
    proof_image: Optional[str] = None
    score_delta: int = 0   # e.g. +25 approved, -10 rejected
    verified_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "verifications"
