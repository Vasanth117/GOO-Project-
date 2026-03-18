from datetime import datetime
from typing import List, Optional

from app.models.user import User, UserRole, UserStatus
from app.models.farm_profile import FarmProfile
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.proof_submission import ProofSubmission
from app.models.fraud_flag import FraudFlag
from app.models.grc_member import GRCMember
from app.schemas.admin_schema import UpdateUserRoleRequest, BanUserRequest, FraudFlagReviewRequest
from app.utils.response_utils import error_response, not_found
import logging

logger = logging.getLogger(__name__)


# ─── USER MANAGEMENT ─────────────────────────────────────────

async def get_all_users(page: int = 1, limit: int = 20, role: Optional[str] = None) -> dict:
    query = {}
    if role:
        query["role"] = role
    
    skip = (page - 1) * limit
    users = await User.find(query).sort(-User.created_at).skip(skip).limit(limit).to_list()
    total = await User.find(query).count()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "has_next": (skip + limit) < total,
        "users": [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "role": u.role.value,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ]
    }


async def update_user_role(user_id: str, data: UpdateUserRoleRequest) -> dict:
    user = await User.get(user_id)
    if not user:
        not_found("User")
    
    user.role = UserRole(data.role)
    await user.save()
    
    logger.info(f"User {user_id} role updated to {data.role}")
    return {"message": f"User role updated to {data.role}", "user_id": user_id}


async def toggle_user_status(user_id: str, data: BanUserRequest) -> dict:
    user = await User.get(user_id)
    if not user:
        not_found("User")
    
    user.status = UserStatus.ACTIVE if data.is_active else UserStatus.BANNED
    # In a real app, we'd store the ban reason in a separate table or a new field
    await user.save()
    
    status_text = "activated" if data.is_active else "deactivated/banned"
    logger.info(f"User {user_id} has been {status_text}")
    return {"message": f"User status updated to {status_text}", "user_id": user_id}


# ─── FRAUD MANAGEMENT ─────────────────────────────────────────

async def get_fraud_flags(status: str = "open", page: int = 1, limit: int = 20) -> dict:
    skip = (page - 1) * limit
    flags = await FraudFlag.find(FraudFlag.status == status).sort(-FraudFlag.created_at).skip(skip).limit(limit).to_list()
    total = await FraudFlag.find(FraudFlag.status == status).count()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "flags": [
            {
                "id": str(f.id),
                "farmer_id": f.farmer_id,
                "reason": f.anomaly_type,
                "severity": f.severity,
                "status": f.status,
                "created_at": f.created_at.isoformat(),
            }
            for f in flags
        ]
    }


async def resolve_fraud_flag(flag_id: str, admin: User, data: FraudFlagReviewRequest) -> dict:
    flag = await FraudFlag.get(flag_id)
    if not flag:
        not_found("Fraud flag")
    
    flag.status = data.status
    flag.resolved_by = str(admin.id)
    flag.resolved_at = datetime.utcnow()
    # In a real app, we'd store admin_notes in the document
    await flag.save()
    
    return {"message": f"Fraud flag {data.status}", "flag_id": flag_id}


# ─── ANALYTICS ───────────────────────────────────────────────

async def get_platform_stats() -> dict:
    total_users = await User.find_all().count()
    total_farmers = await User.find(User.role == UserRole.FARMER).count()
    total_experts = await User.find(User.role == UserRole.EXPERT).count()
    total_sellers = await User.find(User.role == UserRole.SELLER).count()
    total_grc_members = await GRCMember.find_all().count()
    
    total_farms = await FarmProfile.find_all().count()
    total_missions_completed = await MissionProgress.find(MissionProgress.status == MissionStatus.COMPLETED).count()
    total_proofs_submitted = await ProofSubmission.find_all().count()
    open_fraud_flags = await FraudFlag.find(FraudFlag.status == "open").count()
    
    farms = await FarmProfile.find_all().to_list()
    avg_score = 0
    if farms:
        total_score = sum(f.sustainability_score for f in farms)
        avg_score = total_score / len(farms)

    return {
        "total_users": total_users,
        "total_farmers": total_farmers,
        "total_experts": total_experts,
        "total_sellers": total_sellers,
        "total_grc_members": total_grc_members,
        "total_farms": total_farms,
        "total_missions_completed": total_missions_completed,
        "total_proofs_submitted": total_proofs_submitted,
        "open_fraud_flags": open_fraud_flags,
        "average_sustainability_score": round(avg_score, 2),
    }
