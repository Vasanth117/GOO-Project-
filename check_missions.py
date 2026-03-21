import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.app.models.user import User
from backend.app.models.mission import Mission
from backend.app.models.mission_progress import MissionProgress
from backend.app.models.farm_profile import FarmProfile
from backend.app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

async def check_db():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await init_beanie(database=client.get_default_database(), document_models=[User, Mission, MissionProgress, FarmProfile])
        
        users = await User.find_all().to_list()
        missions = await Mission.find_all().to_list()
        progress = await MissionProgress.find_all().to_list()
        farms = await FarmProfile.find_all().to_list()
        
        print(f"Users: {len(users)}")
        print(f"Missions: {len(missions)}")
        print(f"Progress entries: {len(progress)}")
        print(f"Farm profiles: {len(farms)}")
        
        for u in users:
            up = [p for p in progress if p.farmer_id == str(u.id)]
            uf = [f for f in farms if f.farmer_id == str(u.id)]
            print(f"- User {u.email} (ID: {u.id}): {len(up)} missions, {len(uf)} farms")
            for p in up:
                m = next((m for m in missions if str(m.id) == p.mission_id), None)
                print(f"   * Mission: {m.title if m else 'Unknown'} | Status: {p.status}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(check_db())
