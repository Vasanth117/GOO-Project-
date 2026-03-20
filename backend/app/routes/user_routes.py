from fastapi import APIRouter, Depends, File, UploadFile, Form
from app.controllers import user_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response
from typing import Optional

router = APIRouter(prefix="/user", tags=["User Profile"])


@router.get("/me", summary="Get full profile (user + farm stats)")
async def get_profile(current_user: User = Depends(get_current_user)):
    result = await user_controller.get_full_profile(current_user)
    return success_response(result)


@router.put("/me", summary="Update user profile (name, bio, phone)")
async def update_profile(
    name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.update_profile(current_user, name, bio, phone, avatar)
    return success_response(result, "Profile updated successfully")


@router.put("/password", summary="Change password")
async def change_password(
    data: dict,
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.change_password(current_user, data.get("old_password"), data.get("new_password"))
    return success_response(result, "Password changed successfully")


@router.put("/preferences", summary="Update AI and notification preferences")
async def update_preferences(
    data: dict,
    current_user: User = Depends(get_current_user),
):
    result = await user_controller.update_preferences(current_user, data)
    return success_response(result, "Preferences saved")
