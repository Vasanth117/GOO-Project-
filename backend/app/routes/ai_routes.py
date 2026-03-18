from fastapi import APIRouter, Depends, Body
from app.schemas.ai_schema import AdvisorChatRequest, CropRecommendationRequest
from app.controllers import ai_controller
from app.middleware.auth_middleware import get_current_user, require_farmer
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])


@router.post("/advisor", summary="Chat with GOO Farming Advisor")
async def chat_with_advisor(
    data: AdvisorChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Expert AI advice based on your farm context and current weather.
    """
    result = await ai_controller.get_advisor_advice(current_user, data)
    return success_response(result)


@router.post("/recommend-crops", summary="Get crop recommendations for a location")
async def recommend_crops(
    data: CropRecommendationRequest,
    current_user: User = Depends(require_farmer),
):
    """
    Analyzes weather and location to suggest the best crops for the season.
    """
    result = await ai_controller.get_crop_recommendations(current_user, data)
    return success_response(result)


@router.get("/weather-scan", summary="Get AI-enhanced weather analysis")
async def weather_scan(
    lat: float, 
    lon: float, 
    current_user: User = Depends(get_current_user)
):
    """
    Combines raw weather data with AI interpretation for farming risks.
    """
    # Simply reusing the advisor logic with a specific internal prompt
    data = AdvisorChatRequest(
        message="Give me a brief weather scan and tell me if there are any immediate risks to my farm for the next 48 hours.",
        context={"coordinates": {"lat": lat, "lon": lon}}
    )
    result = await ai_controller.get_advisor_advice(current_user, data)
    return success_response(result)
