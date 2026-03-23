from app.models.farm_profile import FarmProfile, HistoryLog
from app.models.user import User
from app.models.score import ScoreChangeReason
from app.schemas.farm_schema import (
    CreateFarmRequest, UpdateFarmRequest, WeeklyCheckinRequest, FarmResponse
)
from app.services.score_service import update_score, get_score_tier
from app.services.badge_service import check_and_award_badges
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.response_utils import error_response, not_found
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def create_farm(user: User, data: CreateFarmRequest) -> dict:
    # One farm per farmer
    existing = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if existing:
        error_response("You already have a farm profile", 409)

    # Calculate initial score based on practices
    initial_score = 100
    if data.farming_practices.value == "organic":
        initial_score = 130
    elif data.pesticide_usage.type == "none":
        initial_score = 115

    farm = FarmProfile(
        farmer_id=str(user.id),
        farm_name=data.farm_name,
        location=data.location,
        farm_size_acres=data.farm_size_acres,
        soil_type=data.soil_type,
        crop_types=data.crop_types,
        irrigation_type=data.irrigation_type,
        fertilizer_usage=data.fertilizer_usage,
        pesticide_usage=data.pesticide_usage,
        farming_practices=data.farming_practices,
        sustainability_score=initial_score,
    )
    await farm.insert()

    # Check for any initial badges
    await check_and_award_badges(str(user.id))

    logger.info(f"Farm created for user {user.id}: {data.farm_name}")
    return _farm_to_dict(farm)


async def get_my_farm(user: User) -> dict:
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        not_found("Farm profile")
    tier = get_score_tier(farm.sustainability_score)
    result = _farm_to_dict(farm)
    result["score_tier"] = tier
    return result


async def get_farm_by_id(farm_id: str) -> dict:
    farm = await FarmProfile.get(farm_id)
    if not farm:
        not_found("Farm profile")
    return _farm_to_dict(farm)


async def update_farm(user: User, data: UpdateFarmRequest) -> dict:
    from app.models.farm_profile import (
        Location as LocationModel,
        FertilizerUsage as FertilizerModel,
        PesticideUsage as PesticideModel,
    )

    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))

    # ── UPSERT: if no farm exists yet, create one with safe defaults ──
    if not farm:
        logger.info(f"No farm profile for user {user.id} — creating one via upsert.")
        loc = data.location
        farm = FarmProfile(
            farmer_id=str(user.id),
            farm_name=data.farm_name or f"{user.name}'s Farm",
            location=loc if loc else LocationModel(latitude=0.0, longitude=0.0),
            farm_size_acres=data.farm_size_acres or 0.0,
            soil_type=data.soil_type or "loam",
            crop_types=data.crop_types or [],
            irrigation_type=data.irrigation_type or "manual",
            fertilizer_usage=data.fertilizer_usage or FertilizerModel(type="organic", quantity_per_week_kg=0),
            pesticide_usage=data.pesticide_usage or PesticideModel(type="none", quantity_per_week_liters=0),
            farming_practices=data.farming_practices or "conventional",
            sustainability_score=100,
        )
        await farm.insert()
        await check_and_award_badges(str(user.id))
        return _farm_to_dict(farm)

    # ── UPDATE existing farm profile ──
    update_data = data.model_dump(exclude_none=True)

    # Score adjustments based on what changed
    if "pesticide_usage" in update_data:
        ptype = data.pesticide_usage.type if data.pesticide_usage else None
        if ptype == "chemical":
            await update_score(str(user.id), ScoreChangeReason.CHEMICAL_USAGE,
                               description="Chemical pesticide reported in update")
        elif ptype == "none":
            await update_score(str(user.id), ScoreChangeReason.ORGANIC_FERTILIZER,
                               description="Switched to no pesticide")

    # farming_practices is a plain lowercased string
    if "farming_practices" in update_data and update_data["farming_practices"] == "organic":
        await update_score(str(user.id), ScoreChangeReason.ORGANIC_FERTILIZER,
                           description="Switched to organic farming")

    # Log history before update
    log_entry = HistoryLog(
        action="profile_update",
        note=f"Updated fields: {list(update_data.keys())}",
    )
    farm.history_logs.append(log_entry)

    # Apply updates — handle Location dict → Location model
    for key, value in update_data.items():
        if key == "location" and isinstance(value, dict):
            setattr(farm, key, LocationModel(**value))
        else:
            setattr(farm, key, value)

    farm.updated_at = datetime.utcnow()
    await farm.save()

    await check_and_award_badges(str(user.id))
    return _farm_to_dict(farm)



async def weekly_checkin(user: User, data: WeeklyCheckinRequest) -> dict:
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        not_found("Farm profile")

    # Update farm usage data
    farm.fertilizer_usage.type = data.fertilizer_type
    farm.fertilizer_usage.quantity_per_week_kg = data.fertilizer_quantity_kg
    farm.pesticide_usage.type = data.pesticide_type
    farm.pesticide_usage.quantity_per_week_liters = data.pesticide_quantity_liters
    farm.last_checkin_at = datetime.utcnow()

    # Log check-in
    log_entry = HistoryLog(
        action="weekly_checkin",
        note=f"Fertilizer: {data.fertilizer_type} {data.fertilizer_quantity_kg}kg, "
             f"Pesticide: {data.pesticide_type} {data.pesticide_quantity_liters}L, "
             f"Water: {data.water_usage_liters}L"
    )
    farm.history_logs.append(log_entry)
    farm.updated_at = datetime.utcnow()
    await farm.save()

    # Score adjustments for check-in
    await update_score(str(user.id), ScoreChangeReason.CHECKIN_BONUS,
                       description="Weekly check-in completed")

    if data.pesticide_type == "chemical" and data.pesticide_quantity_liters > 0:
        await update_score(str(user.id), ScoreChangeReason.CHEMICAL_USAGE,
                           description="Chemical pesticide reported in check-in")

    # Refresh farm and return
    await farm.sync()
    await check_and_award_badges(str(user.id))

    return {
        "message": "Weekly check-in recorded",
        "new_score": farm.sustainability_score,
        "score_tier": get_score_tier(farm.sustainability_score),
    }


async def get_nearby_farms(lat: float, lng: float, radius: float, current_user=None) -> list:
    """
    Returns farm profiles for Snap Map view.
    Respects privacy modes and uses real last_seen_at timestamps.
    """
    farms = await FarmProfile.find_all().to_list()
    now = datetime.utcnow()
    results = []
    for f in farms:
        user = await User.get(f.farmer_id)
        if not user:
            continue
        # Respect ghost mode
        privacy = getattr(f, "privacy_mode", "live")
        if privacy == "ghost":
            continue
        if current_user and str(f.farmer_id) == str(current_user.id):
            continue  # Don't include self in others list

        last_seen = getattr(f, "last_seen_at", None) or f.updated_at
        seconds_ago = (now - last_seen).total_seconds() if last_seen else 9999
        status = "online" if seconds_ago < 300 else "recent" if seconds_ago < 3600 else "offline"
        last_seen_label = "Active now" if seconds_ago < 60 else f"{int(seconds_ago // 60)}m ago" if seconds_ago < 3600 else f"{int(seconds_ago // 3600)}h ago"

        pos_lat = getattr(f, "live_lat", None) or f.location.latitude
        pos_lng = getattr(f, "live_lng", None) or f.location.longitude

        results.append({
            "id": str(f.id),
            "farmer_id": str(f.farmer_id),
            "pos": [pos_lat, pos_lng],
            "name": user.name,
            "farm_name": f.farm_name,
            "role": user.role.value,
            "score": f.sustainability_score,
            "status": status,
            "last_seen": last_seen_label,
            "activity": f"Growing {f.crop_types[0]}" if f.crop_types else "Active farmer",
            "isSeller": user.role.value == "seller",
            "avatar": user.profile_picture,
            "crop_types": f.crop_types,
            "farm_size_acres": f.farm_size_acres,
            "farming_practices": f.farming_practices.value,
            "privacy_mode": privacy,
        })
    return results


async def update_live_location(user: User, lat: float, lng: float) -> dict:
    """Store the user's current live GPS location into their farm profile."""
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        return {"error": "Farm profile not found"}
    farm.set({"live_lat": lat, "live_lng": lng, "last_seen_at": datetime.utcnow()})
    await farm.save()
    return {"live_lat": lat, "live_lng": lng}


async def set_privacy_mode(user: User, mode: str) -> dict:
    """Set location privacy: 'live', 'farm_only', or 'ghost'."""
    valid = ["live", "farm_only", "ghost"]
    if mode not in valid:
        mode = "live"
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        return {"error": "Farm profile not found"}
    farm.set({"privacy_mode": mode})
    await farm.save()
    return {"privacy_mode": mode}


async def get_activity_markers() -> list:
    """Returns recent mission completions and checkins as activity map markers."""
    from app.models.mission_progress import MissionProgress, MissionStatus
    from app.models.proof_submission import ProofSubmission
    markers = []
    recent_completions = await MissionProgress.find(
        MissionProgress.status == MissionStatus.COMPLETED
    ).sort(-MissionProgress.id).limit(30).to_list()

    farms_cache = {}
    for mp in recent_completions:
        fid = mp.farmer_id
        if fid not in farms_cache:
            farms_cache[fid] = await FarmProfile.find_one(FarmProfile.farmer_id == fid)
        farm = farms_cache[fid]
        if not farm:
            continue
        user = await User.get(farm.farmer_id)
        markers.append({
            "type": "mission",
            "pos": [farm.location.latitude, farm.location.longitude],
            "title": mp.title if hasattr(mp, "title") else "Mission Completed",
            "farmer_name": user.name if user else "Farmer",
            "farm_name": farm.farm_name,
            "score": farm.sustainability_score,
        })
    return markers


def _farm_to_dict(farm: FarmProfile) -> dict:
    return {
        "id": str(farm.id),
        "farmer_id": farm.farmer_id,
        "farm_name": farm.farm_name,
        "location": {
            "latitude": farm.location.latitude,
            "longitude": farm.location.longitude,
        },
        "farm_size_acres": farm.farm_size_acres,
        "soil_type": farm.soil_type.value,
        "crop_types": farm.crop_types,
        "irrigation_type": farm.irrigation_type.value,
        "fertilizer_usage": {
            "type": farm.fertilizer_usage.type,
            "quantity_per_week_kg": farm.fertilizer_usage.quantity_per_week_kg,
        },
        "pesticide_usage": {
            "type": farm.pesticide_usage.type,
            "quantity_per_week_liters": farm.pesticide_usage.quantity_per_week_liters,
        },
        "farming_practices": farm.farming_practices.value,
        "sustainability_score": farm.sustainability_score,
        "last_checkin_at": farm.last_checkin_at.isoformat() if farm.last_checkin_at else None,
        "created_at": farm.created_at.isoformat(),
        "updated_at": farm.updated_at.isoformat(),
    }
