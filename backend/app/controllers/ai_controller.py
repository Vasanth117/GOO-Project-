from typing import List, Optional
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.services import ai_service, weather_service
from app.schemas.ai_schema import AdvisorChatRequest, CropRecommendationRequest
from app.utils.response_utils import error_response, not_found
import logging

logger = logging.getLogger(__name__)


from fastapi import Response
from app.services import ai_service, weather_service
from app.schemas.ai_schema import AdvisorChatRequest, CropRecommendationRequest, TTSRequest

async def get_advisor_advice(user: User, data: AdvisorChatRequest) -> dict:
    """Wraps weather and farm data into a detailed context for Llama Advisor."""
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    
    # Contextual check: weather is only fetched if needed or requested
    # But for simplicity, we provide the basic farm profile.
    
    context = {
        "user_name": user.name,
        "farm_profile": farm.model_dump() if farm else None,
        "preferences": user.preferences or {},
        "external_data": data.context or {}
    }

    # Fetch weather if intent usually needs it, or just let AI service handle it via 'weather_service'
    if farm and farm.location:
        # We can pre-fetch weather here if we want to be proactive
        lat, lon = farm.location.latitude, farm.location.longitude
        weather_ctx = await weather_service.get_weather_data(lat, lon)
        context["current_weather"] = weather_ctx

    return await ai_service.get_farming_advice(data.message, context)


async def handle_crop_health_analysis(image_data: bytes, query: Optional[str] = None) -> dict:
    """Analyzes crop health from an uploaded image."""
    return await ai_service.analyze_crop_health(image_data, query)


async def handle_tts(data: TTSRequest) -> Response:
    """Generates audio from text using ElevenLabs."""
    audio_content = await ai_service.generate_voice_advice(data.text, data.voice_id or "pNInz6obpg8nEByWQX2t")
    if not audio_content:
        return error_response("Failed to generate audio", 500)
    
    return Response(content=audio_content, media_type="audio/mpeg")


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
