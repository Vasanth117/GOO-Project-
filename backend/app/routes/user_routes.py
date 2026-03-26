from fastapi import APIRouter, Depends, File, UploadFile, Form, Query
from pydantic import BaseModel
from app.controllers import user_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response, error_response
from typing import Optional


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdatePreferencesRequest(BaseModel):
    push_notifications: Optional[bool] = None
    mission_alerts: Optional[bool] = None
    weather_alerts: Optional[bool] = None
    ai_suggestions: Optional[bool] = None
    advice_priority: Optional[str] = None
    language: Optional[str] = None
    ai_smart_suggestions: Optional[bool] = None

router = APIRouter(prefix="/user", tags=["User Profile"])


@router.get("/search", summary="Search for users by name")
async def search_users(
    q: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.search_users(q, page, limit)
    return success_response(result)


@router.get("/me", summary="Get full profile (user + farm stats)")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    result = await user_controller.get_full_profile(current_user)
    return success_response(result)


@router.get("/{user_id}", summary="Get any user's profile")
async def get_user_profile(user_id: str, current_user: User = Depends(get_current_user)):
    target_user = await User.get(user_id)
    if not target_user:
        return error_response("User not found", 404)
    result = await user_controller.get_full_profile(target_user)
    return success_response(result)


@router.put("/me", summary="Update user profile (name, bio, phone)")
async def update_profile(
    name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    is_private: Optional[bool] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.update_profile(current_user, name, bio, phone, is_private, avatar)
    return success_response(result, "Profile updated successfully")


@router.put("/password", summary="Change password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.change_password(current_user, data.old_password, data.new_password)
    return success_response(result, "Password changed successfully")


@router.put("/preferences", summary="Update AI and notification preferences")
async def update_preferences(
    data: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.update_preferences(current_user, data.model_dump(exclude_none=True))
    return success_response(result, "Preferences saved")
