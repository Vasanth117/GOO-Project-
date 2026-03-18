from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user, require_farmer
from app.models.user import User
from app.services.score_service import get_score_history, get_score_tier
from app.models.farm_profile import FarmProfile
from app.models.streak import Streak
from app.models.badge import FarmerBadge, BadgeDefinition
from app.utils.response_utils import success_response, not_found

router = APIRouter(prefix="/score", tags=["Score & Streaks"])


@router.get("/me", summary="Get current score and tier")
async def get_my_score(current_user: User = Depends(require_farmer)):
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(current_user.id))
    if not farm:
        not_found("Farm profile")

    tier = get_score_tier(farm.sustainability_score)
    return success_response({
        "score": farm.sustainability_score,
        "tier": tier,
    })


@router.get("/history", summary="Get score history for graph")
async def get_score_history_route(
    limit: int = 30,
    current_user: User = Depends(require_farmer),
):
    history = await get_score_history(str(current_user.id), limit=limit)
    return success_response(history)


@router.get("/streak", summary="Get streak info")
async def get_streak(current_user: User = Depends(require_farmer)):
    streak = await Streak.find_one(Streak.farmer_id == str(current_user.id))
    if not streak:
        return success_response({"current_streak": 0, "longest_streak": 0})

    return success_response({
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_activity_date": streak.last_activity_date.isoformat() if streak.last_activity_date else None,
    })


@router.get("/badges", summary="Get my badges")
async def get_my_badges(current_user: User = Depends(require_farmer)):
    earned = await FarmerBadge.find(
        FarmerBadge.farmer_id == str(current_user.id)
    ).to_list()
    all_defs = await BadgeDefinition.find_all().to_list()
    earned_codes = {b.badge_code for b in earned}

    return success_response({
        "earned": [
            {
                "code": b.badge_code,
                "name": b.badge_name,
                "icon": b.badge_icon,
                "tier": b.badge_tier.value,
                "earned_at": b.earned_at.isoformat(),
            }
            for b in earned
        ],
        "locked": [
            {
                "code": d.code,
                "name": d.name,
                "icon": d.icon,
                "tier": d.tier.value,
                "description": d.description,
            }
            for d in all_defs
            if d.code not in earned_codes
        ],
    })
