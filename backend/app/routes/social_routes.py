from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from typing import Optional, List
from app.schemas.social_schema import CreatePostRequest, CreateCommentRequest
from app.controllers import social_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/social", tags=["Social Feed"])


# ─── FEED ────────────────────────────────────────────────────

@router.get("/feed", summary="Get personalized social feed")
async def get_feed(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    post_type: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    result = await social_controller.get_feed(current_user, page=page, limit=limit, post_type=post_type)
    return success_response(result)


# ─── POSTS ───────────────────────────────────────────────────

# ... existing imports ...

@router.post("/posts", summary="Create a new post with optional image")
async def create_post(
    content: str = Form(...),
    tags: Optional[str] = Form(None), # comma-separated
    mission_progress_id: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
):
    tag_list = [t.strip() for t in tags.split(",")] if tags else []
    result = await social_controller.create_post(
        user=current_user,
        content=content,
        tags=tag_list,
        mission_progress_id=mission_progress_id,
        image=image
    )
    return success_response(result, "Post created")


@router.get("/posts/mine", summary="Get my posts")
async def get_my_posts(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    result = await social_controller.get_my_posts(current_user, page=page, limit=limit)
    return success_response(result)


@router.delete("/posts/{post_id}", summary="Delete a post")
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    result = await social_controller.delete_post(post_id, current_user)
    return success_response(result)


# ─── LIKES ───────────────────────────────────────────────────

@router.post("/posts/{post_id}/like", summary="Like or unlike a post (toggle)")
async def toggle_like(post_id: str, current_user: User = Depends(get_current_user)):
    result = await social_controller.toggle_like(post_id, current_user)
    return success_response(result)


# ─── COMMENTS ────────────────────────────────────────────────

@router.post("/posts/{post_id}/comments", summary="Comment on a post")
async def add_comment(
    post_id: str,
    data: CreateCommentRequest,
    current_user: User = Depends(get_current_user),
):
    result = await social_controller.add_comment(post_id, current_user, data)
    return success_response(result, "Comment added")


@router.get("/posts/{post_id}/comments", summary="Get comments on a post")
async def get_comments(
    post_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    result = await social_controller.get_comments(post_id, page=page, limit=limit)
    return success_response(result)


# ─── FOLLOW ──────────────────────────────────────────────────

@router.post("/follow/{target_user_id}", summary="Follow or unfollow a user (toggle)")
async def toggle_follow(target_user_id: str, current_user: User = Depends(get_current_user)):
    result = await social_controller.toggle_follow(target_user_id, current_user)
    return success_response(result)


# ─── PROFILE ─────────────────────────────────────────────────

@router.get("/profile/{user_id}", summary="View a user's public profile")
async def get_profile(user_id: str, current_user: User = Depends(get_current_user)):
    result = await social_controller.get_profile(user_id, current_user)
    return success_response(result)


@router.get("/profile/{user_id}/followers", summary="Get followers list")
async def get_followers(
    user_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    result = await social_controller.get_followers(user_id, page=page, limit=limit)
    return success_response(result)


@router.get("/profile/{user_id}/following", summary="Get following list")
async def get_following(
    user_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    result = await social_controller.get_following(user_id, page=page, limit=limit)
    return success_response(result)
