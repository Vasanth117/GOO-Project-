from beanie import Document, Indexed
from pydantic import EmailStr, Field
from typing import Optional, Annotated
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    FARMER = "farmer"
    EXPERT = "expert"
    SELLER = "seller"
    ADMIN = "admin"
    GRC = "grc"


class UserStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"


class User(Document):
    name: str
    email: Annotated[EmailStr, Indexed(unique=True)]
    password_hash: str
    role: UserRole = UserRole.FARMER
    status: UserStatus = UserStatus.ACTIVE
    is_verified: bool = False
    email_verified: bool = False
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE

    class Settings:
        name = "users"

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Ravi Kumar",
                "email": "ravi@example.com",
                "role": "farmer",
                "status": "active",
            }
        }
