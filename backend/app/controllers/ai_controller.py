from typing import List, Optional
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.services import ai_service, weather_service
from app.schemas.ai_schema import AdvisorChatRequest, CropRecommendationRequest
from app.utils.response_utils import error_response, not_found
import logging

logger = logging.getLogger(__name__)


async def get_advisor_advice(user: User, data: AdvisorChatRequest) -> dict:
    """Wraps weather and farm data into a context for Gemini Advisor."""
    # Try to get farm profile and weather context
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    
    weather_ctx = {}
    if farm and farm.location:
        lat, lon = farm.location.latitude, farm.location.longitude
        weather_ctx = await weather_service.get_weather_data(lat, lon)

    context = {
        "user_name": user.name,
        "farm_details": farm.model_dump() if farm else {},
        "current_weather": weather_ctx,
        "external_data": data.context or {}
    }

    result = await ai_service.get_farming_advice(data.message, context)
    return result


async def get_crop_recommendations(user: User, data: CropRecommendationRequest) -> dict:
    """Gets AI-driven crop recommendations based on location and weather."""
    weather_ctx = await weather_service.get_weather_data(data.latitude, data.longitude)
    
    result = await ai_service.recommend_crops(
        lat=data.latitude,
        lon=data.longitude,
        weather=weather_ctx,
        soil=data.soil_type
    )
    return result


async def auto_verify_proof(image_data: bytes, mission_type: str) -> dict:
    """Public helper to verify proof images using AI."""
    # This is typically called by the proof_controller during submission
    return await ai_service.analyze_farming_proof(image_data, mission_type)
