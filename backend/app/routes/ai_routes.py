from fastapi import APIRouter, Depends, Body, File, UploadFile, Response
from app.schemas.ai_schema import AdvisorChatRequest, CropRecommendationRequest, TTSRequest
from app.controllers import ai_controller
from app.middleware.auth_middleware import get_current_user, require_farmer
from app.models.user import User
from app.utils.response_utils import success_response, error_response

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


@router.post("/analyze-health", summary="Analyze crop disease and safety")
async def analyze_crop_health(
    file: UploadFile = File(...),
    query: str = Body(None),
    current_user: User = Depends(get_current_user),
):
    """
    Analyzes an image of a plant for diseases and provides organic safety advice.
    """
    image_data = await file.read()
    result = await ai_controller.handle_crop_health_analysis(image_data, query)
    return success_response(result)


@router.post("/tts", summary="Convert text to voice advice")
async def generate_voice(
    data: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Produces high-quality voice audio from AI advisor text.
    """
    return await ai_controller.handle_tts(data)


@router.post("/recommend-crops", summary="Get crop recommendations for a location")
async def recommend_crops(
    current_user: User = Depends(require_farmer),
    data: CropRecommendationRequest = Body(...)
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
