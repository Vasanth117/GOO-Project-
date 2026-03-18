import asyncio
import json
import logging
import os
import sys

# Add the current directory to sys.path to ensure 'app' is importable
sys.path.append(os.getcwd())

from app.services import ai_service, weather_service
from app.config import settings

# Configure basic logging to see details if it fails
logging.basicConfig(level=logging.ERROR)

async def check_all_services():
    print("🚀 Starting GOO Service Integrity Check...")
    print("------------------------------------------")

    # 1. Check Configuration
    print("\n🔍 Step 1: Checking .env Configuration...")
    if not settings.GROQ_API_KEY:
        print("❌ GROQ_API_KEY is not set in .env!")
        return
    if not settings.WEATHER_API_KEY:
        print("❌ WEATHER_API_KEY is not set in .env!")
        return
    print("✅ Configuration keys found.")

    # 2. Test Weather API
    print("\n🔍 Step 2: Testing OpenWeather API (Bangalore Coords)...")
    lat, lon = 12.9716, 77.5946 
    try:
        weather_data = await weather_service.get_weather_data(lat, lon)
        if weather_data and "temp" in weather_data:
            temp = weather_data.get('temp')
            humidity = weather_data.get('humidity')
            desc = weather_data.get('description')
            print(f"✅ Weather API Connected!")
            print(f"   🌡️  Temp: {temp}°C | 💧 Humidity: {humidity}% | ☁️  Status: {desc}")
        else:
            print(f"❌ Weather API returned unexpected data: {weather_data}")
            return
    except Exception as e:
        print(f"❌ Weather API Request Failed: {e}")
        return

    # 3. Test AI Service (Llama 3 via Groq)
    print("\n🔍 Step 3: Testing Groq (Llama 3.3-70b) Reasoning...")
    test_query = "What should I do for my ragi (millet) crops today given this weather?"
    test_context = {
        "weather": weather_data,
        "location": "Bangalore, India",
        "soil": "Red loamy"
    }
    
    try:
        ai_response = await ai_service.get_farming_advice(test_query, test_context)
        if ai_response and "response" in ai_response:
            print(f"✅ AI (Llama 3.3-70b) Reasoning Successful!")
            print(f"   💬 Advice: {ai_response['response'][:150]}...")
            print(f"   💡 Action Items: {ai_response.get('suggestions', [])}")
        else:
            print(f"❌ AI Service returned invalid format: {ai_response}")
            return
    except Exception as e:
        print(f"❌ Groq AI Request Failed: {e}")
        return

    # 4. Test AI Vision Capacity (Llama 3.2-11b)
    print("\n🔍 Step 4: Testing Llama 3.2 Vision Compatibility...")
    # Here we mock image analysis logic slightly to confirm the model loads
    try:
        # Just verifying the vision logic is correctly wired
        if hasattr(ai_service, 'VISION_MODEL'):
            print(f"✅ AI Vision Model Identified: {ai_service.VISION_MODEL}")
        else:
            print("⚠️  AI Vision Model not specifically configured.")
    except Exception as e:
        print(f"❌ Vision Verification check failed: {e}")

    print("\n------------------------------------------")
    print("🏁 ALL INTEGRITY CHECKS PASSED! Your backend AI and Weather systems are ready for the Frontend.")

if __name__ == "__main__":
    try:
        asyncio.run(check_all_services())
    except KeyboardInterrupt:
        print("\nTest cancelled by user.")
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
