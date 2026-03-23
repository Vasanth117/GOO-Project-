from fastapi import APIRouter, Depends, Query
from app.controllers import leaderboard_controller
from app.middleware.auth_middleware import get_current_user, require_farmer
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

VALID_TYPES = ["national", "local", "district", "streaks", "mission_champions", "water_savers"]


@router.get("/{board_type}", summary="Get leaderboard by type")
async def get_leaderboard(
    board_type: str,
    timeframe: str = Query(default="all-time", description="weekly, monthly, all-time"),
    region: str = Query(default="all", description="Region name for local/district boards"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    result = await leaderboard_controller.get_leaderboard(
        board_type=board_type,
        timeframe=timeframe,
        region=region,
        page=page,
        limit=limit,
        current_user=current_user,
    )
    return success_response(result)


@router.get("/me/rank", summary="Get my rank across all leaderboards")
async def get_my_rank(current_user: User = Depends(require_farmer)):
    result = await leaderboard_controller.get_my_rank(current_user)
    return success_response(result)
