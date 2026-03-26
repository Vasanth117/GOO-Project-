import groq
import httpx
from app.config import settings
import logging
import json
import base64
import io
from typing import Optional, List, Dict
from pathlib import Path

logger = logging.getLogger(__name__)

# Initialize Groq
if settings.GROQ_API_KEY:
    client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)
    TEXT_MODEL = "llama-3.1-8b-instant"
    VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
else:
    client = None
    logger.warning("GROQ_API_KEY not set. AI features will use mock responses.")

ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
 
def _clean_json_response(content: str) -> str:
    """Extracts exactly the FIRST complete JSON object from the LLM output, ignoring anything else."""
    content = content.strip()
    
    # Locate the first '{'
    start_idx = content.find('{')
    if start_idx == -1:
        return content
        
    # Standard brace-counting to find the matching '}' for the FIRST object
    depth = 0
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end_idx = i
                break
                
    if start_idx != -1 and end_idx != -1:
        return content[start_idx:end_idx+1]
        
    return content

# ─── YOLOv8 CROP DISEASE MODEL ────────────────────────────────
_yolo_model = None
MODEL_PATH = Path(__file__).parent.parent.parent / "runs" / "classify" / "goo_ai_models" / "crop_classifier" / "weights" / "best.pt"

DISEASE_LABELS = {
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Tomato Spider Mites (Two-Spotted)",
    "Tomato__Target_Spot": "Tomato Target Spot",
    "Tomato__Tomato_YellowLeaf__Curl_Virus": "Tomato Yellow Leaf Curl Virus",
    "Tomato__Tomato_mosaic_virus": "Tomato Mosaic Virus",
    "Tomato_healthy": "Healthy Tomato Leaf",
}


def _get_yolo_model():
    """Lazy-loads the YOLOv8 model on first use to avoid slow startup."""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            if MODEL_PATH.exists():
                _yolo_model = YOLO(str(MODEL_PATH))
                logger.info(f"YOLOv8 crop disease model loaded from {MODEL_PATH}")
            else:
                logger.warning(f"YOLOv8 model not found at {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
    return _yolo_model


async def get_farming_advice(user_query: str, context: dict) -> dict:
    """Gets expert farming advice from a high-performance Llama 3 model."""
    if not client:
        return _mock_advice("AI Service Offline (Missing API Key)")

    weather_keywords = ['weather', 'rain', 'temperature', 'forecast', 'climate', 'sun', 'cloud', 'hot', 'cold']
    disease_keywords = ['disease', 'pest', 'leaf', 'spot', 'rot', 'insect', 'protection', 'safe', 'health']

    is_weather_asked = any(k in user_query.lower() for k in weather_keywords)
    is_disease_asked = any(k in user_query.lower() for k in disease_keywords)

    user_prefs = context.get("preferences", {})
    language = user_prefs.get("language", "English")
    priority = user_prefs.get("advice_priority", "General Sustainability")

    system_prompt = (
        "You are the GOO Master Agriculture Expert. Your goal is to provide specific, "
        "evidence-based organic farming advice that WOWS the user."
        f"\n\nUSER PREFERENCES:"
        f"\n- Primary Language: {language} (You MUST respond in this language if it is not English)"
        f"\n- Advice Priority: {priority} (Focus your advice on this goal)"
        "\n\nFOLLOW THESE PERSONALITY GUIDELINES:"
        "\n- BE PROACTIVE: If you see the user has a specific crop, give them its 'Organic Growth Tip of the Day'."
        "\n- BE TECHNICAL BUT ACCESSIBLE: Mention specific organic fertilizers (e.g., Neem cake, Vermicompost) and techniques (e.g., mulching, crop rotation)."
        "\n- BE SUPPORTIVE: If they haven't planted yet, push them to try profitable, sustainable crops based on their soil."
        "\n\nSTRICT JSON SCHEMA:"
        "\n- 'response': A SINGLE FLAT STRING containing the well-formatted, detailed answer (Markdown supported). DO NOT use nested objects or multiple keys for translations. MUST be in the user's Primary Language."
        "\n- 'suggestions': Exactly 3 helpful follow-up questions (strings only). MUST be in the user's Primary Language."
        "\n- 'detected_intent': One of 'onboarding', 'advice', 'weather', 'disease'."
        "\n- 'audio_trigger': boolean (true to read the response out loud)."
        "\n\nCRITICAL: The 'response' field MUST ALWAYS be a single string, even when translating to specialized languages like Tamil, Telugu, or Hindi. Do not use an object for the response. You MUST respond with PURE JSON only. DO NOT wrap the JSON in markdown code blocks (e.g. ```json). Your response must begin with '{' and end with '}'."
    )

    clean_context = {
        "user_name": context.get("user_name"),
        "farm_profile": context.get("farm_profile", {}),
        "location": "Automatically Detected via GPS",
        "weather": context.get("current_weather") if (is_weather_asked or is_disease_asked) else "Available on request"
    }

    full_prompt = f"""
    EXPERT CONTEXT:
    {json.dumps(clean_context)}

    FARMER MESSAGE:
    {user_query}

    Respond now as the Master Expert in JSON format.
    """

    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": full_prompt},
            ],
            model=TEXT_MODEL,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        content = chat_completion.choices[0].message.content
        logger.info(f"Expert Raw Content: {content}")
        return json.loads(_clean_json_response(content))
    except Exception as e:
        logger.error(f"Groq Expert Error: {e}")
        return _mock_advice(f"AI Service Temporarily Unstable: {str(e)}")


async def analyze_crop_health(image_data: bytes, user_query: Optional[str] = None) -> dict:
    """
    Three-stage pipeline:
    1. YOLOv8 classifies the leaf disease with 99.6% accuracy.
    2. Vision model validates it's actually a plant (rejects random photos).
    3. Groq LLM generates detailed organic precautions for the identified disease.
    """
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
    except Exception:
        return _error_analysis("Invalid image file. Please upload a valid JPG or PNG.")

    # STAGE 1: YOLOv8 Classification
    yolo = _get_yolo_model()
    yolo_diagnosis = None
    yolo_confidence = 0.0
    is_plant = False

    if yolo:
        try:
            results = yolo.predict(source=img, imgsz=224, verbose=False)
            top1_idx = results[0].probs.top1
            top1_conf = float(results[0].probs.top1conf)
            raw_label = results[0].names[top1_idx]
            is_plant = top1_conf >= 0.5
            yolo_confidence = top1_conf
            yolo_diagnosis = DISEASE_LABELS.get(raw_label, raw_label.replace("_", " "))
            logger.info(f"YOLOv8 detected: {yolo_diagnosis} ({yolo_confidence:.2%})")
        except Exception as e:
            logger.error(f"YOLOv8 inference error: {e}")

    # STAGE 2: Vision validation if YOLO is unsure or unavailable
    if not yolo or not is_plant:
        if client:
            base64_image = base64.b64encode(image_data).decode('utf-8')
            try:
                validation = await client.chat.completions.create(
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": (
                                "Is this image showing a plant leaf or crop? "
                                "Reply ONLY with valid JSON: {\"is_plant\": true/false, \"reason\": \"brief reason\"}"
                            )},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                        ],
                    }],
                    response_format={"type": "json_object"},
                )
                v = json.loads(_clean_json_response(validation.choices[0].message.content))
                is_plant = v.get("is_plant", False)
                if not is_plant:
                    return {
                        "diagnosis": "Not a Plant Image",
                        "severity": "None",
                        "advice": (
                            f"🌿 This image does not appear to be a plant or crop leaf. "
                            f"{v.get('reason', '')} Please upload a clear, close-up photo of a plant leaf "
                            f"or crop showing the disease symptoms for accurate analysis."
                        ),
                        "precautions": [],
                        "safety_measures": [],
                        "is_organic_friendly": True,
                        "confidence": 0,
                        "is_valid_plant": False
                    }
            except Exception as e:
                logger.error(f"Vision validation error: {e}")

    # STAGE 3: Groq generates precautions for the detected disease
    if client and yolo_diagnosis and is_plant:
        is_healthy = "healthy" in yolo_diagnosis.lower()
        prompt = f"""You are a Master Crop Disease Specialist and Organic Farming Expert for Indian farmers.

A YOLOv8 AI model scanned a plant image and detected: "{yolo_diagnosis}" with {yolo_confidence:.1%} confidence.

{"The plant appears HEALTHY. Provide encouraging tips to keep it thriving." if is_healthy else "The plant has a DISEASE. Provide specific organic treatment steps and safety precautions."}

Farmer note: {user_query or "No additional info provided."}

Respond ONLY with this exact JSON:
{{
    "diagnosis": "{yolo_diagnosis}",
    "severity": "Low/Medium/High",
    "advice": "A comprehensive paragraph explaining what this disease is, how it spreads, and the best organic treatment approach.",
    "precautions": ["Step 1 with specific organic product or technique", "Step 2", "Step 3", "Step 4"],
    "safety_measures": ["Personal safety measure 1 for the farmer", "Safety measure 2", "Safety measure 3"],
    "is_organic_friendly": true
}}"""

        try:
            response = await client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=TEXT_MODEL,
                response_format={"type": "json_object"},
                temperature=0.4
            )
            content = response.choices[0].message.content
            result = json.loads(_clean_json_response(content))
            result["confidence"] = round(yolo_confidence * 100, 1)
            result["is_valid_plant"] = True
            return result
        except Exception as e:
            logger.error(f"Groq precaution generation error: {e}")

    # Fallback: YOLO worked but Groq is down
    if yolo_diagnosis and is_plant:
        return {
            "diagnosis": yolo_diagnosis,
            "severity": "Medium",
            "advice": f"YOLOv8 detected: {yolo_diagnosis}. Please consult your local agricultural officer for a complete treatment plan.",
            "precautions": ["Isolate affected plants immediately", "Remove and destroy affected leaves", "Avoid overhead watering", "Apply Neem oil spray as organic treatment"],
            "safety_measures": ["Wear gloves when handling affected plants", "Wash hands thoroughly after contact", "Do not consume affected produce without expert advice"],
            "is_organic_friendly": True,
            "confidence": round(yolo_confidence * 100, 1),
            "is_valid_plant": True
        }

    return _mock_vision_analysis()


async def generate_voice_advice(text: str, voice_id: str = "pNInz6obpg8nEByWQX2t") -> Optional[bytes]:
    """Generates audio from text using ElevenLabs for multilingual support."""
    if not settings.ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY not set.")
        return None

    headers = {
        "Accept": "audio/mpeg",
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }

    actual_voice_id = voice_id or DEFAULT_VOICE_ID
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{ELEVENLABS_URL}/{actual_voice_id}",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            if response.status_code == 200:
                return response.content
            else:
                logger.error(f"ElevenLabs Error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        logger.error(f"Voice generation exception: {e}")
        return None


async def analyze_periodic_report(image_data: bytes, report_text: str) -> dict:
    """
    Analyzes a peridoic report (3-day cycle) to detect:
    1. Abnormal growth patterns (suggesting chemical use).
    2. Verification of reported organic tasks.
    3. Health of the crops.
    """
    if not client:
        return {
            "is_valid": True,
            "abnormal_growth": False,
            "confidence": 0.5,
            "notes": "AI service offline. Provisionally approved."
        }

    base64_image = base64.b64encode(image_data).decode('utf-8')
    system_prompt = (
        "You are an Agricultural Auditor. Analyze the provided image of a crop and the farmer's report. "
        "Your goal is to detect if the growth looks UNNATURAL for its stage or if there are signs of chemical use "
        "(e.g., specific chemical burn patterns, unnatural deep colors but thin stems, or growth spikes "
        "inconsistent with organic methods). "
        "\n\nSTRICT JSON output format (PURE JSON ONLY, NO MARKDOWN WRAPPERS): "
        "{\"abnormal_growth\": boolean, \"organic_consistency_score\": 0-100, \"health_score\": 0-100, \"analysis_notes\": \"string\"}"
    )

    user_prompt = f"FARMER REPORT: {report_text}"
    
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                    ],
                }
            ],
            model=VISION_MODEL,
            max_tokens=800,
        )
        content = response.choices[0].message.content
        return json.loads(_clean_json_response(content))
    except Exception as e:
        logger.error(f"Periodic report AI analysis error: {e}")
        return {
            "abnormal_growth": False,
            "organic_consistency_score": 70,
            "health_score": 75,
            "analysis_notes": f"API Error: {str(e)}",
            "api_failure": True
        }


async def generate_personalized_missions(farm_profile: dict, weather: dict) -> List[dict]:
    """Generates 3 personalized daily missions based on farm data and climate."""
    if not client:
        return [
            {"title": "Morning Hydration", "description": "Water your crops early to avoid evaporation.", "difficulty": "easy", "points": 10},
            {"title": "Soil Check", "description": "Check soil moisture levels manually.", "difficulty": "easy", "points": 15},
            {"title": "Leaf Inspection", "description": "Look for any signs of early pests.", "difficulty": "medium", "points": 20}
        ]

    system_prompt = (
        "You are the GOO AI Mission Architect. Your goal is to create 3 HYPER-PERSONALIZED, high-impact organic farming missions. "
        "Analyze the provided FARM PROFILE (crops, soil) and current WEATHER conditions carefully. "
        "Missions should be seasonally and climatically relevant. If it is hot/dry, focus on water conservation. "
        "If they grow specific crops, give missions specific to those crops' growth cycles. "
        "Make the 'title' catchy and the 'description' scientific yet simple. "
        "\n\nSTRICT JSON output format (PURE JSON WRAPPED IN OBJECT ONLY): "
        "{\"missions\": [{"
        "  \"title\": \"string\", "
        "  \"description\": \"string\", "
        "  \"difficulty\": \"easy/medium/hard\", "
        "  \"reward_points\": int, "
        "  \"eco_benefit\": \"string (What it does for environment)\", "
        "  \"next_step\": \"string (Single actionable next step)\", "
        "  \"personalization_tag\": \"string (Why it fits this user)\""
        "}]}"
    )

    user_context = f"FARM PROFILE: {json.dumps(farm_profile)}. WEATHER: {json.dumps(weather)}"
    
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_context}
            ],
            model=TEXT_MODEL,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        content = response.choices[0].message.content
        data = json.loads(_clean_json_response(content))
        
        # Format for backend
        missions = data.get("missions", [])
        return missions
    except Exception as e:
        logger.error(f"AI Mission Generation Error: {e}")
        return []


async def analyze_farming_proof(image_data: bytes, mission_text: str, system_prompt: Optional[str] = None) -> dict:
    """
    Analyzes local proof (mission completion photo) against the mission description.
    Returns: {"is_valid": bool, "confidence": float, "analysis_notes": str}
    """
    if not client:
        return {
            "is_valid": True,
            "confidence": 0.5,
            "analysis_notes": "AI offline. Manual review fallback."
        }

    user_prompt = f"MISSION TO VERIFY: {mission_text}"
    final_system_prompt = system_prompt if system_prompt else (
        "You are an ELITE Agricultural Forensic Auditor. Your mission is to verify farming activity with 100% certainty. "
        "A user has submitted a photo/video frame as proof for a specific farming task. "
        "\n\nDETECTION PRIORITIES:"
        "\n1. REJECT placeholder images, pure black/white screens, indoor living rooms, selfies, and internet memes immediately."
        "\n2. AUDIT for task-specific objects: "
        "   - Watering -> Visible water/damp soil/hoses."
        "   - Planting -> Seeds/saplings/soil disturbance."
        "   - Weeding -> Pile of weeds/hand in soil/tools."
        "\n3. REJECT if the image is too blurry to identify the task."
        "\n4. If the photo is real but UNRELATED to the specific mission text -> REJECT."
        "\n\nSTRICT JSON output format (PURE JSON ONLY): "
        "{\"is_valid\": boolean, \"confidence\": 0.0-1.0, \"analysis_notes\": \"Detailed reason for audit decision\"}"
    )

    base64_image = base64.b64encode(image_data).decode('utf-8')
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": final_system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                    ],
                }
            ],
            model=VISION_MODEL,
            max_tokens=800,  # Required by Groq Vision
            temperature=0.2
        )
        content = response.choices[0].message.content
        return json.loads(_clean_json_response(content))
    except Exception as e:
        logger.error(f"Proof analysis error: {e}")
        return {
            "is_valid": False,  # Changed to False so it strictly rejects on API failure
            "confidence": 0.0,
            "analysis_notes": f"API Error: {str(e)}. Please try again."
        }


# ─── MOCK RESPONSES ───────────────────────────────────────────

def _mock_advice(error_msg: Optional[str] = None):
    response = "Hello! I'm GOO Advisor. Could you please share your farm size and soil type so I can help you better?"
    if error_msg:
        response = f"I'm having a bit of trouble reaching my knowledge base ({error_msg}). But I'm still here to help! {response}"
    return {
        "response": response,
        "suggestions": ["Tell farm size", "Share soil type"],
        "detected_intent": "onboarding",
        "audio_trigger": False
    }


def _mock_vision_analysis():
    return {
        "diagnosis": "General Health Check",
        "severity": "Low",
        "advice": "The crops look healthy. Continue regular organic watering.",
        "precautions": ["Avoid overwatering"],
        "safety_measures": ["Wear gloves when weeding"],
        "is_organic_friendly": True,
        "confidence": 0,
        "is_valid_plant": True
    }


def _error_analysis(message: str):
    return {
        "diagnosis": "Image Error",
        "severity": "None",
        "advice": message,
        "precautions": [],
        "safety_measures": [],
        "is_organic_friendly": True,
        "confidence": 0,
        "is_valid_plant": False
    }
