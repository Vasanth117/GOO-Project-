import asyncio
import os
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.mission import Mission
from app.models.mission_progress import MissionProgress
from app.models.farm_profile import FarmProfile
from app.models.community_mission import CommunityMission
from app.controllers import mission_controller
from app.config import settings
import json

async def debug():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Mission, MissionProgress, FarmProfile, CommunityMission])
    
    # Get a farmer
    user = await User.find_one({"role": "farmer"})
    if not user:
        print("No farmer found")
        return
    
    print(f"Farmer found: {user.email}")
    
    print("\n--- ACTIVE MISSIONS FROM CONTROLLER ---")
    active_missions = await mission_controller.get_active_missions(user)
    print(json.dumps(active_missions, indent=2, default=str))

    print("\n--- DB COMMUNITY PROGRESS FOR THIS FARMER ---")
    progress_community = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id)
    ).to_list()
    
    for mp in progress_community:
        m = await Mission.get(mp.mission_id)
        if m and m.mission_type == "community":
            print(f"- {m.title}: {mp.status.value}")

if __name__ == "__main__":
    asyncio.run(debug())
