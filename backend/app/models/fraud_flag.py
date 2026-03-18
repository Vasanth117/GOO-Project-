from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class FraudSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class FraudFlag(Document):
    farmer_id: str
    anomaly_type: str     # e.g. "gps_mismatch", "duplicate_image", "sudden_score_spike"
    description: str
    severity: FraudSeverity
    status: FraudStatus = FraudStatus.OPEN
    evidence: Optional[str] = None  # JSON string of evidence data
    resolved_by: Optional[str] = None  # Admin ID
    resolution_note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "fraud_flags"
