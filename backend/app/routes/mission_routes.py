from fastapi import APIRouter, Depends, Query
from app.schemas.mission_schema import CreateMissionRequest, ReviewProofRequest
from app.controllers import mission_controller
from app.middleware.auth_middleware import get_current_user, require_farmer, require_admin
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/missions", tags=["Missions"])


# ─── FARMER ROUTES ───────────────────────────────────────────

@router.get("/active", summary="Get all active missions for current farmer")
async def get_active_missions(current_user: User = Depends(require_farmer)):
    result = await mission_controller.get_active_missions(current_user)
    return success_response(result)


@router.get("/history", summary="Get mission completion history")
async def get_mission_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_farmer),
):
    result = await mission_controller.get_mission_history(current_user, page=page, limit=limit)
    return success_response(result)


@router.get("/{mission_progress_id}", summary="Get a specific mission detail")
async def get_mission_detail(
    mission_progress_id: str,
    current_user: User = Depends(require_farmer),
):
    result = await mission_controller.get_mission_detail(mission_progress_id, current_user)
    return success_response(result)


@router.patch("/{mission_progress_id}/start", summary="Start a mission")
async def start_mission(
    mission_progress_id: str,
    current_user: User = Depends(require_farmer),
):
    result = await mission_controller.start_mission(mission_progress_id, current_user)
    return success_response(result, "Mission started!")


# ─── ADMIN ROUTES ────────────────────────────────────────────

@router.get("/admin/all", summary="Admin: List all mission templates")
async def admin_list_missions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await mission_controller.admin_list_missions(page=page, limit=limit)
    return success_response(result)


@router.post("/admin/create", summary="Admin: Create a mission template")
async def admin_create_mission(
    data: CreateMissionRequest,
    current_user: User = Depends(require_admin),
):
    result = await mission_controller.admin_create_mission(data, current_user)
    return success_response(result, "Mission template created")


@router.post("/admin/{mission_id}/assign-all", summary="Admin: Assign mission to all farmers")
async def admin_assign_mission(
    mission_id: str,
    current_user: User = Depends(require_admin),
):
    result = await mission_controller.admin_assign_mission_to_all(mission_id)
    return success_response(result, "Mission assigned to all eligible farmers")
