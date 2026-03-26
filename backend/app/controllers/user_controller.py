from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.models.streak import Streak
from app.models.mission_progress import MissionProgress, MissionStatus
from app.utils.response_utils import error_response
from datetime import datetime
from typing import Optional
import logging
from app.utils.password_utils import hash_password, verify_password
import shutil
import os
from pathlib import Path
from fastapi import UploadFile

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "avatars"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def get_full_profile(user: User) -> dict:
    """Returns user info + farm profile + score stats merged into one clean object."""
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    streak = await Streak.find_one(Streak.farmer_id == str(user.id))
    
    # Calculate tasks completed from MissionProgress
    tasks_count = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.COMPLETED
    ).count()

    # Calculate follow counts
    from app.models.follow import Follow
    followers_count = await Follow.find(Follow.following_id == str(user.id)).count()
    following_count = await Follow.find(Follow.follower_id == str(user.id)).count()


    # If no farm profile yet, we return defaults safely
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "bio": user.bio or "",
        "phone": user.phone or "",
        "profile_picture": user.profile_picture,
        "role": user.role,
        "is_verified": user.is_verified,
        "is_private": getattr(user, "is_private", False),
        "followers_count": followers_count,
        "following_count": following_count,
        "created_at": user.created_at.isoformat(),
        "preferences": getattr(user, "preferences", {}),
        "farm": {
            "farm_name": farm.farm_name if farm else None,
            "farm_size_acres": farm.farm_size_acres if farm else None,
            "soil_type": farm.soil_type if farm else None,
            "crop_types": farm.crop_types if farm else [],
            "irrigation_type": farm.irrigation_type if farm else None,
            "farming_practices": farm.farming_practices if farm else None,
            "sustainability_score": farm.sustainability_score if farm else 0,
            "location": farm.location.model_dump() if farm and farm.location else None,
        },
        "stats": {
            "total_score": farm.sustainability_score if farm else 0, # Sustainability score acts as XP
            "tasks_completed": tasks_count,
            "streak_current": streak.current_streak if streak else 0,
            "streak_longest": streak.longest_streak if streak else 0,
            "rank": "Coming Soon", # Rank logic could be added here
        }
    }


async def update_profile(
    user: User,
    name: Optional[str],
    bio: Optional[str],
    phone: Optional[str],
    is_private: Optional[bool],
    avatar: Optional[UploadFile]
) -> dict:
    """Updates user's name, bio, phone and optionally their avatar image."""
    if name:
        user.name = name
    if bio is not None:
        user.bio = bio
    if phone is not None:
        user.phone = phone
    if is_private is not None:
        user.is_private = is_private

    if avatar and avatar.filename:
        ext = Path(avatar.filename).suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            return error_response("Invalid image type. JPG/PNG only.", 400)
        filename = f"{str(user.id)}{ext}"
        filepath = UPLOAD_DIR / filename
        with open(filepath, "wb") as f:
            shutil.copyfileobj(avatar.file, f)
        user.profile_picture = f"/uploads/avatars/{filename}?v={int(datetime.utcnow().timestamp())}"

    user.updated_at = datetime.utcnow()
    await user.save()

    return {
        "name": user.name,
        "bio": user.bio,
        "phone": user.phone,
        "profile_picture": user.profile_picture,
    }


async def change_password(user: User, old_password: str, new_password: str) -> dict:
    """Verifies old password then updates to new hashed password.
    Uses the same passlib/pbkdf2_sha256 scheme as registration to avoid salt errors.
    """
    if not old_password or not new_password:
        raise ValueError("Both old and new passwords are required.")

    if not verify_password(old_password, user.password_hash):
        raise ValueError("Incorrect current password.")

    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters.")

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    await user.save()
    return {"message": "Password updated successfully."}


async def update_preferences(user: User, prefs: dict) -> dict:
    """Saves AI preferences, language and notification settings to the user document."""
    current_prefs = getattr(user, "preferences", {}) or {}
    current_prefs.update(prefs)
    user.preferences = current_prefs
    user.updated_at = datetime.utcnow()
    await user.save()
    return {"preferences": user.preferences}


async def search_users(q: str, page: int = 1, limit: int = 10) -> dict:
    """Searches for users by name or email with case-insensitive regex."""
    skip = (page - 1) * limit
    # Search by name or email (case-insensitive)
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }
    
    users = await User.find(query).skip(skip).limit(limit).to_list()
    total = await User.find(query).count()
    
    return {
        "users": [
            {
                "id": str(u.id),
                "name": u.name,
                "profile_picture": u.profile_picture,
                "role": u.role,
                "bio": u.bio or ""
            } for u in users
        ],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }
