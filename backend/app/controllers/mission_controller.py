from app.models.mission import Mission, MissionType
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.schemas.mission_schema import CreateMissionRequest, MissionProgressResponse, MissionHistoryResponse
from app.utils.response_utils import error_response, not_found
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
        "difficulty": mission.difficulty.value if mission else "",
        "reward_points": mission.reward_points if mission else 0,
        "requires_photo": mission.proof_requirement.requires_photo if mission else True,
        "proof_description": mission.proof_requirement.description if mission else "",
        "status": mp.status.value,
        "proof_submission_id": mp.proof_submission_id,
        "points_earned": mp.points_earned,
        "assigned_at": mp.assigned_at.isoformat(),
        "started_at": mp.started_at.isoformat() if mp.started_at else None,
        "expires_at": mp.expires_at.isoformat(),
        "completed_at": mp.completed_at.isoformat() if mp.completed_at else None,
    }


# ─── FARMER ACTIONS ──────────────────────────────────────────

async def get_active_missions(user: User) -> list:
    """Return all active/in-progress missions for a farmer, grouped by type."""
    now = datetime.utcnow()
    missions = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status.in_([MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS]),
        MissionProgress.expires_at > now,
    ).to_list()

    result = []
    for mp in missions:
        result.append(await _enrich_progress(mp))

    # Group by type
    grouped = {"daily": [], "weekly": [], "monthly": [], "community": [], "long_term": [], "surprise": []}
    for item in result:
        t = item.get("mission_type", "daily")
        if t in grouped:
            grouped[t].append(item)

    return grouped


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
        MissionProgress.status.in_([MissionStatus.COMPLETED, MissionStatus.EXPIRED, MissionStatus.REJECTED]),
    ).sort(-MissionProgress.assigned_at).skip(skip).limit(limit).to_list()

    total = await MissionProgress.find(
        MissionProgress.farmer_id == str(user.id),
        MissionProgress.status.in_([MissionStatus.COMPLETED, MissionStatus.EXPIRED, MissionStatus.REJECTED]),
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


# ─── ADMIN ACTIONS ───────────────────────────────────────────

async def admin_create_mission(data: CreateMissionRequest, admin: User) -> dict:
    """Admin creates a new mission template."""
    from app.models.mission import ProofRequirement
    mission = Mission(
        title=data.title,
        description=data.description,
        mission_type=data.mission_type,
        difficulty=data.difficulty,
        reward_points=data.reward_points,
        proof_requirement=ProofRequirement(
            requires_photo=data.requires_photo,
            requires_video=data.requires_video,
            requires_gps=data.requires_gps,
            description=data.proof_description,
        ),
        duration_hours=data.duration_hours,
        target_score_min=data.target_score_min,
        target_score_max=data.target_score_max,
        created_by=str(admin.id),
    )
    await mission.insert()
    logger.info(f"Admin {admin.id} created mission: {data.title}")
    return {"id": str(mission.id), "title": mission.title, "status": "created"}


async def admin_assign_mission_to_all(mission_id: str) -> dict:
    """Admin assigns a mission template to all eligible farmers."""
    mission = await Mission.get(mission_id)
    if not mission:
        not_found("Mission template")

    farms = await FarmProfile.find_all().to_list()
    expires_at = datetime.utcnow() + timedelta(hours=mission.duration_hours)
    count = 0

    for farm in farms:
        # Skip if already assigned and active
        existing = await MissionProgress.find_one(
            MissionProgress.farmer_id == farm.farmer_id,
            MissionProgress.mission_id == mission_id,
            MissionProgress.status.in_([MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS]),
        )
        if existing:
            continue

        # Score range targeting
        if mission.target_score_min and farm.sustainability_score < mission.target_score_min:
            continue
        if mission.target_score_max and farm.sustainability_score > mission.target_score_max:
            continue

        mp = MissionProgress(
            farmer_id=farm.farmer_id,
            mission_id=mission_id,
            expires_at=expires_at,
        )
        await mp.insert()
        count += 1

    logger.info(f"Mission {mission_id} assigned to {count} farmers")
    return {"assigned_to": count, "mission_title": mission.title}


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
