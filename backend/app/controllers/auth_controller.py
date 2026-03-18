from app.models.user import User, UserStatus
from app.models.refresh_token import RefreshToken
from app.models.streak import Streak
from app.models.reward import Reward
from app.schemas.auth_schema import (
    RegisterRequest, LoginRequest, RefreshTokenRequest, UserResponse, AuthResponse
)
from app.utils.password_utils import hash_password, verify_password
from app.utils.jwt_utils import create_access_token, create_refresh_token, decode_token
from app.utils.response_utils import error_response, not_found, unauthorized
from datetime import datetime, timedelta
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def _build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role.value,
        status=user.status.value,
        is_verified=user.is_verified,
        profile_picture=user.profile_picture,
        created_at=user.created_at.isoformat(),
    )


async def register(data: RegisterRequest) -> AuthResponse:
    # Check if email exists
    existing = await User.find_one(User.email == data.email)
    if existing:
        error_response("Email already registered", 409)

    # Create user
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    await user.insert()

    # Initialize streak and reward wallet for farmers
    if data.role.value in ("farmer", "grc"):
        await Streak(farmer_id=str(user.id)).insert()

    # Generate tokens
    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store refresh token
    expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await RefreshToken(
        user_id=str(user.id), token=refresh_token, expires_at=expires
    ).insert()

    logger.info(f"New user registered: {user.email} [{user.role.value}]")

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_build_user_response(user),
    )


async def login(data: LoginRequest) -> AuthResponse:
    user = await User.find_one(User.email == data.email)
    if not user:
        unauthorized("Invalid email or password")

    if not verify_password(data.password, user.password_hash):
        unauthorized("Invalid email or password")

    if user.status == UserStatus.BANNED:
        error_response("Your account has been banned", 403)

    if user.status == UserStatus.SUSPENDED:
        error_response("Your account is suspended", 403)

    token_data = {"sub": str(user.id), "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await RefreshToken(
        user_id=str(user.id), token=refresh_token, expires_at=expires
    ).insert()

    logger.info(f"User logged in: {user.email}")
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_build_user_response(user),
    )


async def refresh_access_token(data: RefreshTokenRequest) -> dict:
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        unauthorized("Invalid refresh token")

    # Check it's in DB and not revoked
    stored = await RefreshToken.find_one(
        RefreshToken.token == data.refresh_token,
        RefreshToken.is_revoked == False,
    )
    if not stored or stored.expires_at < datetime.utcnow():
        unauthorized("Refresh token expired or revoked")

    user_id = payload.get("sub")
    user = await User.get(user_id)
    if not user:
        unauthorized("User not found")

    token_data = {"sub": str(user.id), "role": user.role.value}
    new_access_token = create_access_token(token_data)

    return {"access_token": new_access_token, "token_type": "bearer"}


async def logout(refresh_token: str):
    stored = await RefreshToken.find_one(RefreshToken.token == refresh_token)
    if stored:
        stored.is_revoked = True
        await stored.save()
    return {"message": "Logged out successfully"}


async def get_me(user: User) -> UserResponse:
    return _build_user_response(user)
