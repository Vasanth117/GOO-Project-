import asyncio
import os
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.mission import Mission
from app.models.mission_progress import MissionProgress
from app.models.farm_profile import FarmProfile
from app.controllers import mission_controller
from app.config import settings

async def debug():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Mission, MissionProgress, FarmProfile])
    
    # Get a farmer
    user = await User.find_one({"role": "farmer"})
    if not user:
        print("No farmer found")
        return
    
    print(f"Assigning missions to user: {user.email} ({user.id})")
    missions = await mission_controller.auto_assign_ai_missions(user)
    print("Missions assigned:")
    import json
    # Custom serializer for potential UUIDs/ObjectIDs if needed, but dict is usually fine
    print(missions)

if __name__ == "__main__":
    asyncio.run(debug())
