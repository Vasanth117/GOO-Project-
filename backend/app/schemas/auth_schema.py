from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    role: UserRole = UserRole.FARMER

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Ravi Kumar",
                "email": "ravi@example.com",
                "password": "secure123",
                "role": "farmer"
            }
        }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "ravi@example.com",
                "password": "secure123"
            }
        }


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    is_verified: bool
    profile_picture: Optional[str] = None
    created_at: str
    farm_profile: Optional[dict] = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
