from app.models.grc_member import GRCMember
from app.models.verification import Verification, VerificationStatus
from app.models.farm_profile import FarmProfile
from app.models.user import User, UserRole
from app.models.streak import Streak
from app.models.fraud_flag import FraudFlag
from app.models.score import ScoreChangeReason
from app.models.badge import FarmerBadge
from app.schemas.social_schema import GRCVerifyRequest
from app.services.score_service import update_score
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.response_utils import error_response, not_found
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ─── GRC MEMBER ACTIONS ──────────────────────────────────────

async def get_pending_verifications(grc_user: User, page: int = 1, limit: int = 20) -> dict:
    """GRC member views farms requesting community verification."""
    skip = (page - 1) * limit
    # Farms that haven't been verified recently
    farms = await FarmProfile.find_all().skip(skip).limit(limit).to_list()
    total = await FarmProfile.find_all().count()

    farm_list = []
    for farm in farms:
        farmer = await User.get(farm.farmer_id)
        recent_verify = await Verification.find_one(
            Verification.farm_id == str(farm.id)
        )
        farm_list.append({
            "farm_id": str(farm.id),
            "farmer_id": farm.farmer_id,
            "farmer_name": farmer.name if farmer else "Unknown",
            "farm_name": farm.farm_name,
            "sustainability_score": farm.sustainability_score,
            "farming_practices": farm.farming_practices.value,
            "last_verified": recent_verify.verified_at.isoformat() if recent_verify else None,
        })

    return {
        "page": page, "limit": limit, "total": total,
        "has_next": (skip + limit) < total,
        "farms": farm_list,
    }


async def verify_farm(farm_id: str, grc_user: User, data: GRCVerifyRequest) -> dict:
    """GRC member approves or rejects a farm's community verification."""
    farm = await FarmProfile.get(farm_id)
    if not farm:
        not_found("Farm")

    # Prevent self-verification
    if farm.farmer_id == str(grc_user.id):
        error_response("You cannot verify your own farm", 400)

    score_delta = 25 if data.decision == "approve" else -10

    verification = Verification(
        farm_id=farm_id,
        verifier_id=str(grc_user.id),
        verifier_role="grc",
        status=VerificationStatus.APPROVED if data.decision == "approve" else VerificationStatus.REJECTED,
        notes=data.notes,
        score_delta=score_delta,
    )
    await verification.insert()

    # Update verifier's verification count
    grc_member = await GRCMember.find_one(GRCMember.farmer_id == str(grc_user.id))
    if grc_member:
        grc_member.verifications_count += 1
        await grc_member.save()

    # Apply score change to farmer
    if data.decision == "approve":
        await update_score(
            farmer_id=farm.farmer_id,
            reason=ScoreChangeReason.COMMUNITY_VERIFIED,
            description=f"Farm verified by GRC member {grc_user.name}",
        )
        await send_notification(
            user_id=farm.farmer_id,
            notif_type=NotificationType.COMMUNITY_VERIFIED,
            title="🌍 Farm Verified by Community!",
            message=f"GRC member {grc_user.name} verified your farm. +25 points!",
            link="/score",
        )
    else:
        await update_score(
            farmer_id=farm.farmer_id,
            reason=ScoreChangeReason.PROOF_REJECTED,
            custom_delta=-10,
            description=f"Farm verification rejected by GRC: {data.notes or 'No reason given'}",
        )
        await send_notification(
            user_id=farm.farmer_id,
            notif_type=NotificationType.SYSTEM,
            title="❌ Farm Verification Rejected",
            message=f"GRC member rejected your verification: {data.notes or 'Improve your practices and try again.'}",
        )

    logger.info(f"Farm {farm_id} {data.decision}d by GRC member {grc_user.id}")
    return {
        "verification_id": str(verification.id),
        "decision": data.decision,
        "score_delta": score_delta,
        "farm_name": farm.farm_name,
    }


# ─── ADMIN: GRC MANAGEMENT ───────────────────────────────────

async def check_grc_eligibility(admin: User) -> dict:
    """Admin: Find all farmers eligible for GRC membership."""
    farms = await FarmProfile.find(FarmProfile.sustainability_score >= 3001).to_list()
    eligible = []

    for farm in farms:
        # Check not already GRC
        already_grc = await GRCMember.find_one(GRCMember.farmer_id == farm.farmer_id)
        if already_grc:
            continue

        # Check no active fraud flags
        fraud_flag = await FraudFlag.find_one(
            FraudFlag.farmer_id == farm.farmer_id,
            FraudFlag.status == "open",
        )
        if fraud_flag:
            continue

        # Check streak
        streak = await Streak.find_one(Streak.farmer_id == farm.farmer_id)
        if not streak or streak.longest_streak < 30:
            continue

        farmer = await User.get(farm.farmer_id)
        eligible.append({
            "farmer_id": farm.farmer_id,
            "farmer_name": farmer.name if farmer else "Unknown",
            "score": farm.sustainability_score,
            "longest_streak": streak.longest_streak,
        })

    return {"eligible_count": len(eligible), "candidates": eligible}


async def invite_to_grc(farmer_id: str, admin: User) -> dict:
    """Admin invites a farmer to GRC."""
    farmer = await User.get(farmer_id)
    if not farmer:
        not_found("Farmer")

    already = await GRCMember.find_one(GRCMember.farmer_id == farmer_id)
    if already:
        error_response("This farmer is already a GRC member", 409)

    # Create GRC record
    grc = GRCMember(farmer_id=farmer_id, invited_by=str(admin.id))
    await grc.insert()

    # Update user role to GRC
    farmer.role = UserRole.GRC
    await farmer.save()

    await send_notification(
        user_id=farmer_id,
        notif_type=NotificationType.GRC_INVITATION,
        title="🌍 Welcome to the Green Revolution Club!",
        message="You've been selected as a GRC member. You can now verify other farms and help build our eco community!",
        link="/grc",
    )

    logger.info(f"Farmer {farmer_id} invited to GRC by admin {admin.id}")
    return {"message": f"{farmer.name} is now a GRC member", "farmer_id": farmer_id}


async def get_grc_members(page: int = 1, limit: int = 20) -> dict:
    """List all GRC members."""
    skip = (page - 1) * limit
    members = await GRCMember.find(GRCMember.is_active == True).skip(skip).limit(limit).to_list()
    total = await GRCMember.find(GRCMember.is_active == True).count()

    result = []
    for m in members:
        farmer = await User.get(m.farmer_id)
        farm = await FarmProfile.find_one(FarmProfile.farmer_id == m.farmer_id)
        result.append({
            "farmer_id": m.farmer_id,
            "farmer_name": farmer.name if farmer else "Unknown",
            "score": farm.sustainability_score if farm else 0,
            "verifications_done": m.verifications_count,
            "accepted_at": m.accepted_at.isoformat(),
        })

    return {"page": page, "limit": limit, "total": total, "has_next": (skip + limit) < total, "members": result}
