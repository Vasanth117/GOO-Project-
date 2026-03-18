from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── USER MANAGEMENT ─────────────────────────────────────────

class UpdateUserRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(farmer|expert|seller|admin|grc)$")


class BanUserRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None


# ─── FRAUD MANAGEMENT ─────────────────────────────────────────

class FraudFlagReviewRequest(BaseModel):
    status: str = Field(..., pattern="^(resolved|dismissed)$")
    admin_notes: str


# ─── RESPONSE SCHEMAS ────────────────────────────────────────

class AdminUserOverview(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: str


class AdminDashboardStats(BaseModel):
    total_users: int
    total_farmers: int
    total_experts: int
    total_sellers: int
    total_grc_members: int
    total_farms: int
    total_missions_completed: int
    total_proofs_submitted: int
    open_fraud_flags: int
    average_sustainability_score: float
