from fastapi import APIRouter, Depends, HTTPException
from app.controllers import follow_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response, error_response
from typing import Optional, Dict


router = APIRouter(prefix="/follow", tags=["Social / Following"])


@router.post("/{target_user_id}", summary="Follow or request to follow a user")
async def follow(
    target_user_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await follow_controller.follow_user(current_user, target_user_id)
        return success_response(result)
    except ValueError as e:
        return error_response(str(e))


@router.delete("/{target_user_id}", summary="Unfollow or remove follow request")
async def unfollow(
    target_user_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await follow_controller.unfollow_user(current_user, target_user_id)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))


@router.get("/requests", summary="Get pending follow requests for the authenticated user")
async def get_requests(current_user: User = Depends(get_current_user)):
    try:
        result = await follow_controller.get_pending_requests(current_user)
        return success_response(result)
    except Exception as e:
        return error_response(str(e))


@router.post("/request/{request_id}/respond", summary="Accept or decline a follow request")
async def respond_to_request(
    request_id: str,
    accept: bool,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await follow_controller.respond_to_request(current_user, request_id, accept)
        return success_response(result)
    except ValueError as e:
        return error_response(str(e))


@router.get("/status/{target_user_id}", summary="Check follow status relative to a target user")
async def get_status(
    target_user_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        result = await follow_controller.get_follow_status(current_user, target_user_id)
        return success_response({"status": result})
    except Exception as e:
        return error_response(str(e))
