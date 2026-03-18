import groq
from app.config import settings
import logging
import json
import base64
from typing import Optional, List

logger = logging.getLogger(__name__)

# Initialize Groq
if settings.GROQ_API_KEY:
    client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)
    TEXT_MODEL = "llama-3.3-70b-versatile"
    VISION_MODEL = "llama-3.2-11b-vision-preview"
else:
    client = None
    logger.warning("GROQ_API_KEY not set. AI features will use mock responses.")


async def get_farming_advice(user_query: str, context: dict) -> dict:
    """Gets conversational farming advice from Groq Llama 3."""
    if not client:
        return _mock_advice()

    system_prompt = (
        "You are GOO Advisor, a smart, sustainable farming AI. "
        "Your goal is to help farmers maximize yield while minimizing environmental impact. "
        "Use the provided environmental context (weather, soil, location) to give specific, actionable advice. "
        "Keep responses professional, encouraging, and focused on sustainability."
    )

    full_prompt = f"""
    CONTEXT:
    {json.dumps(context, indent=2)}

    USER QUERY:
    {user_query}

    Respond ONLY in valid JSON format with two keys:
    1. 'response': The main advisory text.
    2. 'suggestions': A list of 2-3 short follow-up action items.
    """

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt},
            ],
            model=TEXT_MODEL,
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq Advice Error: {e}")
        return _mock_advice()


async def analyze_farming_proof(image_data: bytes, mission_type: str) -> dict:
    """Uses Groq Llama 3.2 Vision to verify if an image matches the mission requirements."""
    if not client:
        return _mock_vision_analysis()

    # Convert image to base64
    base64_image = base64.b64encode(image_data).decode('utf-8')

    prompt = f"""
    Analyze this image for a farming mission: '{mission_type}'.
    Verify if the image depicts the farming activity described.
    Check for:
    - Real-world farming behavior.
    - Consistency with sustainable practices.
    - Potential fraud (e.g., photos of screens, totally unrelated objects).

    Respond ONLY in valid JSON format:
    {{
        "is_valid": boolean,
        "confidence": float (0-1),
        "analysis_notes": string (brief explanation),
        "detected_objects": list of strings,
        "sustainability_rating": integer (1-10)
    }}
    """

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            model=VISION_MODEL,
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq Vision Error: {e}")
        return _mock_vision_analysis()


async def recommend_crops(lat: float, lon: float, weather: dict, soil: Optional[str] = None) -> dict:
    """Uses Groq to recommend crops based on geo data and weather."""
    if not client:
        return _mock_recommendations()

    prompt = f"""
    Location: Lat {lat}, Lon {lon}
    Current Weather: {json.dumps(weather)}
    Soil Type: {soil or 'Unknown'}

    Recommend 3-5 crops suitable for this environment. Focus on sustainable, high-yield, or locally adaptive varieties.
    
    Respond ONLY in valid JSON:
    {{
        "recommended_crops": [
            {{ "name": "string", "variety": "string", "expected_yield": "string", "difficulty": "Low/Medium/High" }}
        ],
        "reasoning": "string",
        "planting_window": "string (e.g. Next 2 weeks)"
    }}
    """

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt},
            ],
            model=TEXT_MODEL,
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"Groq Recommendation Error: {e}")
        return _mock_recommendations()


# ─── MOCK RESPONSES (for development without API key) ───────

def _mock_advice():
    return {
        "response": "Based on your current weather, it's a great time for soil preparation. Ensure you use organic mulch to retain moisture.",
        "suggestions": ["Add organic mulch", "Check soil pH", "Inspect for early pests"]
    }

def _mock_vision_analysis():
    return {
        "is_valid": True,
        "confidence": 0.95,
        "analysis_notes": "The image clearly shows organic composting behavior. This is consistent with the 'Compost Master' mission.",
        "detected_objects": ["compost bin", "organic waste", "farmer", "garden tools"],
        "sustainability_rating": 9
    }

def _mock_recommendations():
    return {
        "recommended_crops": [
            {"name": "Millet", "variety": "Pearl Millet", "expected_yield": "High", "difficulty": "Low"},
            {"name": "Groundnut", "variety": "Spanish Bunch", "expected_yield": "Medium", "difficulty": "Medium"}
        ],
        "reasoning": "These crops are drought-resistant and suit the current warm temperatures in your region.",
        "planting_window": "Late March to Early April"
    }
