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
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        not_found("Farm profile")

    update_data = data.model_dump(exclude_none=True)
    score_delta = 0

    # Score adjustments based on what changed
    if "pesticide_usage" in update_data:
        ptype = data.pesticide_usage.type if data.pesticide_usage else None
        if ptype == "chemical":
            await update_score(str(user.id), ScoreChangeReason.CHEMICAL_USAGE,
                               description="Chemical pesticide reported in update")
        elif ptype == "none":
            await update_score(str(user.id), ScoreChangeReason.ORGANIC_FERTILIZER,
                               description="Switched to no pesticide")

    if "farming_practices" in update_data and data.farming_practices.value == "organic":
        await update_score(str(user.id), ScoreChangeReason.ORGANIC_FERTILIZER,
                           description="Switched to organic farming")

    # Log history before update
    log_entry = HistoryLog(
        action="profile_update",
        note=f"Updated fields: {list(update_data.keys())}",
    )
    farm.history_logs.append(log_entry)

    # Apply updates
    for key, value in update_data.items():
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
