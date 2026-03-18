from fastapi import APIRouter, Depends, Query
from app.schemas.admin_schema import UpdateUserRoleRequest, BanUserRequest, FraudFlagReviewRequest
from app.controllers import admin_controller
from app.middleware.auth_middleware import require_admin
from app.models.user import User
from app.utils.response_utils import success_response
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin Panel"])


# ─── USER MANAGEMENT ─────────────────────────────────────────

@router.get("/users", summary="Admin: List all users")
async def list_users(
    role: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_all_users(page=page, limit=limit, role=role)
    return success_response(result)


@router.patch("/users/{user_id}/role", summary="Admin: Change user role")
async def update_role(
    user_id: str,
    data: UpdateUserRoleRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.update_user_role(user_id, data)
    return success_response(result)


@router.patch("/users/{user_id}/status", summary="Admin: Ban/Unban user")
async def update_status(
    user_id: str,
    data: BanUserRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.toggle_user_status(user_id, data)
    return success_response(result)


# ─── FRAUD MANAGEMENT ─────────────────────────────────────────

@router.get("/fraud-flags", summary="Admin: View fraud flags")
async def list_fraud_flags(
    status: str = Query("open"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.get_fraud_flags(status=status, page=page, limit=limit)
    return success_response(result)


@router.post("/fraud-flags/{flag_id}/resolve", summary="Admin: Resolve fraud flag")
async def resolve_flag(
    flag_id: str,
    data: FraudFlagReviewRequest,
    current_user: User = Depends(require_admin),
):
    result = await admin_controller.resolve_fraud_flag(flag_id, current_user, data)
    return success_response(result)


# ─── ANALYTICS ───────────────────────────────────────────────

@router.get("/stats", summary="Admin: Get platform-wide statistics")
async def get_stats(current_user: User = Depends(require_admin)):
    result = await admin_controller.get_platform_stats()
    return success_response(result)
