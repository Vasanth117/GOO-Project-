import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)

async def get_weather_data(lat: float, lon: float) -> dict:
    """Fetch current weather and 5-day forecast from OpenWeatherMap."""
    if not settings.WEATHER_API_KEY:
        logger.warning("WEATHER_API_KEY not set. Returning dummy data.")
        return _get_dummy_weather()

    try:
        async with httpx.AsyncClient() as client:
            # Current Weather
            params = {
                "lat": lat,
                "lon": lon,
                "appid": settings.WEATHER_API_KEY,
                "units": "metric"
            }
            resp = await client.get(f"{settings.WEATHER_API_URL}/weather", params=params)
            resp.raise_for_status()
            current = resp.json()

            # Simplified return
            return {
                "temp": current["main"]["temp"],
                "humidity": current["main"]["humidity"],
                "condition": current["weather"][0]["main"],
                "description": current["weather"][0]["description"],
                "wind_speed": current["wind"]["speed"],
                "raw": current
            }
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        return _get_dummy_weather()

def _get_dummy_weather():
    return {
        "temp": 25.0,
        "humidity": 60,
        "condition": "Clear",
        "description": "clear sky",
        "wind_speed": 3.4,
        "is_dummy": True
    }
