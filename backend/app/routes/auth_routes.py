from fastapi import APIRouter, Depends
from app.schemas.auth_schema import (
    RegisterRequest, LoginRequest, RefreshTokenRequest
)
from app.controllers import auth_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", summary="Register a new user")
async def register(data: RegisterRequest):
    result = await auth_controller.register(data)
    return success_response(result, "Registered successfully")


@router.post("/login", summary="Login and get tokens")
async def login(data: LoginRequest):
    result = await auth_controller.login(data)
    return success_response(result, "Logged in successfully")


@router.post("/refresh-token", summary="Refresh access token")
async def refresh_token(data: RefreshTokenRequest):
    result = await auth_controller.refresh_access_token(data)
    return success_response(result, "Token refreshed")


@router.post("/logout", summary="Logout and revoke refresh token")
async def logout(data: RefreshTokenRequest):
    result = await auth_controller.logout(data.refresh_token)
    return success_response(result, "Logged out successfully")


@router.get("/me", summary="Get current user info")
async def get_me(current_user: User = Depends(get_current_user)):
    result = await auth_controller.get_me(current_user)
    return success_response(result)
