from app.models.mission import Mission, MissionType
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.schemas.mission_schema import CreateMissionRequest
from app.utils.response_utils import error_response, not_found
from app.services import ai_service, weather_service
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


# ─── HELPERS ─────────────────────────────────────────────────

async def _enrich_progress(mp: MissionProgress) -> dict:
    """Attach mission template details to a MissionProgress record."""
    mission = await Mission.get(mp.mission_id)
    return {
        "progress_id": str(mp.id),
        "mission_id": mp.mission_id,
        "title": mission.title if mission else "Unknown",
        "description": mission.description if mission else "",
        "mission_type": mission.mission_type.value if mission else "",
        "difficulty": mission.difficulty.value if mission else "easy",
        "reward_points": mission.reward_points if mission else 0,
        "eco_benefit": mission.eco_benefit if mission else "",
        "next_step": mission.next_step if mission else "",
        "personalization_tag": mission.personalization_tag if mission else None,
        "requires_photo": mission.proof_requirement.requires_photo if mission else True,
        "proof_description": mission.proof_requirement.description if mission else "",
        "status": mp.status.value,
        "progress_percentage": mp.progress_percentage,
        "current_step": mp.current_step,
        "proof_submission_id": mp.proof_submission_id,
        "points_earned": mp.points_earned,
        "assigned_at": mp.assigned_at.isoformat(),
        "started_at": mp.started_at.isoformat() if mp.started_at else None,
        "expires_at": mp.expires_at.isoformat(),
        "completed_at": mp.completed_at.isoformat() if mp.completed_at else None,
    }


# ─── FARMER ACTIONS ──────────────────────────────────────────

async def get_active_missions(user: User) -> dict:
    """Return all active/in-progress missions for a farmer, grouped by type."""
    try:
        progress_items = await MissionProgress.find(
            {
                "farmer_id": str(user.id),
                "status": {"$in": [MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS, MissionStatus.PENDING_REVIEW]}
            }
        ).to_list()

        result = []
        for mp in progress_items:
            try:
                enriched = await _enrich_progress(mp)
                result.append(enriched)
            except Exception as e:
                logger.error(f"Error enriching mission {mp.id}: {e}")
                continue

        # Group by type
        grouped = {"daily": [], "weekly": [], "monthly": [], "community": [], "long_term": [], "surprise": []}
        for item in result:
            t = item.get("mission_type", "daily")
            if t in grouped:
                grouped[t].append(item)
            else:
                grouped["daily"].append(item)

        return grouped
    except Exception as e:
        logger.error(f"FATAL error in get_active_missions: {e}", exc_info=True)
        return {"daily": [], "weekly": [], "monthly": [], "community": [], "long_term": [], "surprise": []}


async def get_mission_detail(mission_progress_id: str, user: User) -> dict:
    """Get full detail of a single mission progress item."""
    mp = await MissionProgress.get(mission_progress_id)
    if not mp or mp.farmer_id != str(user.id):
        not_found("Mission")
    return await _enrich_progress(mp)


async def start_mission(mission_progress_id: str, user: User) -> dict:
    """Mark a mission as in-progress."""
    mp = await MissionProgress.get(mission_progress_id)
    if not mp or mp.farmer_id != str(user.id):
        not_found("Mission")

    if mp.status != MissionStatus.ACTIVE:
        error_response(f"Mission cannot be started (current status: {mp.status.value})", 400)

    if mp.expires_at < datetime.utcnow():
        error_response("Mission has already expired", 400)

    mp.status = MissionStatus.IN_PROGRESS
    mp.started_at = datetime.utcnow()
    await mp.save()

    return await _enrich_progress(mp)


async def get_mission_history(user: User, page: int = 1, limit: int = 20) -> dict:
    """Paginated mission history (completed + expired)."""
    skip = (page - 1) * limit
    missions = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        {"status": {"$in": [MissionStatus.COMPLETED, MissionStatus.EXPIRED, MissionStatus.REJECTED]}},
    ).sort(-MissionProgress.assigned_at).skip(skip).limit(limit).to_list()

    total = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        {"status": {"$in": [MissionStatus.COMPLETED, MissionStatus.EXPIRED, MissionStatus.REJECTED]}},
    ).count()

    completed = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.COMPLETED,
    ).count()

    expired = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.EXPIRED,
    ).count()

    # Total points earned
    completed_missions = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status == MissionStatus.COMPLETED,
    ).to_list()
    total_points = sum(m.points_earned for m in completed_missions)

    enriched = [await _enrich_progress(mp) for mp in missions]

    return {
        "total_completed": completed,
        "total_expired": expired,
        "total_points_earned": total_points,
        "page": page,
        "limit": limit,
        "total": total,
        "has_next": (skip + limit) < total,
        "missions": enriched,
    }

async def admin_list_missions(page: int = 1, limit: int = 20) -> dict:
    """Admin lists all mission templates."""
    skip = (page - 1) * limit
    missions = await Mission.find_all().skip(skip).limit(limit).to_list()
    total = await Mission.find_all().count()

    return {
        "page": page, "limit": limit, "total": total,
        "missions": [
            {
                "id": str(m.id),
                "title": m.title,
                "type": m.mission_type.value,
                "difficulty": m.difficulty.value,
                "reward_points": m.reward_points,
                "duration_hours": m.duration_hours,
                "is_active": m.is_active,
                "created_by": m.created_by,
            }
            for m in missions
        ]
    }

async def auto_assign_ai_missions(user: User) -> dict:
    """Uses AI to generate and assign missions for a specific farmer including community tasks."""
    from app.models.farm_profile import FarmProfile
    from app.models.mission import Mission, MissionType
    from app.models.mission_progress import MissionProgress
    
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    
    # ─── 1. FORCE ASSIGN COMMUNITY TASKS ───────────────────────────
    community_tasks = [
        {"title": "Plastic-Free Farm", "description": "Remove all non-biodegradable waste from farm paths.", "difficulty": "medium", "reward_points": 50},
        {"title": "Local Seed Bank", "description": "Trade or document 3 local heirloom seed varieties.", "difficulty": "hard", "reward_points": 100},
        {"title": "Beneficial Insect Hotel", "description": "Build a small habitat using twigs and straw.", "difficulty": "medium", "reward_points": 60},
        {"title": "Water Table Monitor", "description": "Measure and report the water level in your farm well.", "difficulty": "easy", "reward_points": 30},
        {"title": "Native Hedge Row", "description": "Plant 2 meters of native shrubs to prevent wind erosion.", "difficulty": "hard", "reward_points": 120},
        {"title": "Organic Pesticide Mix", "description": "Create a batch of neem oil spray for your crops.", "difficulty": "medium", "reward_points": 45},
        {"title": "Community Compost Share", "description": "Contribute 5kg of green waste to a shared pit.", "difficulty": "easy", "reward_points": 25},
        {"title": "Erosion Barrier", "description": "Place stones or logs along a slope to stop runoff.", "difficulty": "medium", "reward_points": 70},
        {"title": "Nitrogen Fixation Check", "description": "Verify root nodules on your legume crops.", "difficulty": "medium", "reward_points": 40},
        {"title": "Zero Tillage Zone", "description": "Maintain a 10sqm area without any tilling for a month.", "difficulty": "hard", "reward_points": 200}
    ]

    for ct in community_tasks:
        existing_t = await Mission.find_one(Mission.title == ct["title"])
        if not existing_t:
            existing_t = Mission(
                title=ct["title"],
                description=ct["description"],
                mission_type=MissionType.COMMUNITY,
                difficulty=ct["difficulty"],
                reward_points=ct["reward_points"],
                created_by="SYSTEM_AI_GENERATED",
                duration_hours=720
            )
            await existing_t.insert()
        
        m_id = str(existing_t.id)
        exists = await MissionProgress.find_one(
            MissionProgress.farmer_id == str(user.id),
            MissionProgress.mission_id == m_id,
            {"status": {"$in": [MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS, MissionStatus.PENDING_REVIEW, MissionStatus.COMPLETED]}}
        )
        if not exists:
            mp = MissionProgress(farmer_id=str(user.id), mission_id=m_id, expires_at=datetime.utcnow() + timedelta(days=30))
            await mp.insert()

    # ─── 2. ASSIGN PERSONALIZED AI TASKS IF NOT ENOUGH ACTIVE
    progress_items = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        {"status": {"$in": [MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS, MissionStatus.PENDING_REVIEW]}}
    ).to_list()
    
    personal_active = 0
    for p in progress_items:
        m = await Mission.get(p.mission_id)
        if m and m.mission_type != MissionType.COMMUNITY:
            personal_active += 1
            
    if personal_active >= 3:
        return await get_active_missions(user)

    # ─── 3. ASSIGN PERSONALIZED AI TASKS ────────────────────────────
    # Try calling AI service
    ai_missions = [
        {"title": "Daily Hydration Audit", "description": "Inspect your irrigation lines for leaks.", "difficulty": "easy", "reward_points": 15, "type": "daily"},
        {"title": "Weekly Organic Enrichment", "description": "Apply organic mulch to your vegetable beds.", "difficulty": "medium", "reward_points": 40, "type": "weekly"},
        {"title": "Monthly Carbon Check", "description": "Audit your farm energy use for the last month.", "difficulty": "medium", "reward_points": 100, "type": "monthly"}
    ]

    if farm:
        try:
            weather = await weather_service.get_weather_data(farm.location.latitude, farm.location.longitude) if farm.location else weather_service._get_dummy_weather()
            farm_data = {"crops": getattr(farm, 'crop_types', 'unknown'), "soil": getattr(farm, 'soil_type', 'unknown'), "score": getattr(farm, 'sustainability_score', 0)}
            custom = await ai_service.generate_personalized_missions(farm_data, weather)
            if custom: ai_missions = custom
        except: pass

    for am in ai_missions:
        m_type = str(am.get("type", "daily")).lower()
        enum_type = MissionType.DAILY if m_type == "daily" else MissionType.WEEKLY if m_type == "weekly" else MissionType.MONTHLY
        duration = 24 if enum_type == MissionType.DAILY else 168 if enum_type == MissionType.WEEKLY else 720
        
        mission = Mission(
            title=am.get("title", "AI Task"),
            description=am.get("description", ""),
            mission_type=enum_type,
            difficulty=am.get("difficulty", "medium"),
            reward_points=am.get("reward_points", 20),
            duration_hours=duration,
            created_by="SYSTEM_AI_PERSONALIZED"
        )
        await mission.insert()
        mp = MissionProgress(farmer_id=str(user.id), mission_id=str(mission.id), expires_at=datetime.utcnow() + timedelta(hours=duration))
        await mp.insert()
        
    logger.info(f"AI assigned missions to farmer {user.id}")
    return await get_active_missions(user)
