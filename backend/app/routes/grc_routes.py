from fastapi import APIRouter, Depends, Query
from app.schemas.social_schema import GRCVerifyRequest
from app.controllers import grc_controller
from app.middleware.auth_middleware import get_current_user, require_grc, require_admin
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/grc", tags=["Green Revolution Club"])


# ─── GRC MEMBER ROUTES ───────────────────────────────────────

@router.get("/pending-verifications", summary="GRC: View farms pending verification")
async def get_pending_verifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_grc),
):
    result = await grc_controller.get_pending_verifications(current_user, page=page, limit=limit)
    return success_response(result)


@router.post("/verify/{farm_id}", summary="GRC: Verify or reject a farm")
async def verify_farm(
    farm_id: str,
    data: GRCVerifyRequest,
    current_user: User = Depends(require_grc),
):
    result = await grc_controller.verify_farm(farm_id, current_user, data)
    return success_response(result, f"Farm {data.decision}d successfully")


@router.get("/members", summary="View all GRC members")
async def get_grc_members(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    result = await grc_controller.get_grc_members(page=page, limit=limit)
    return success_response(result)


# ─── ADMIN ROUTES ────────────────────────────────────────────

@router.get("/admin/eligible", summary="Admin: Find GRC-eligible farmers")
async def check_eligibility(current_user: User = Depends(require_admin)):
    result = await grc_controller.check_grc_eligibility(current_user)
    return success_response(result)


@router.post("/admin/invite/{farmer_id}", summary="Admin: Invite farmer to GRC")
async def invite_to_grc(
    farmer_id: str,
    current_user: User = Depends(require_admin),
):
    result = await grc_controller.invite_to_grc(farmer_id, current_user)
    return success_response(result, "GRC invitation sent")
