from app.models.mission_progress import MissionProgress, MissionStatus
from app.services.streak_service import reset_streak
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from typing import List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def run_mission_expiry_check():
    """
    Hourly job: Mark expired missions and reset streaks for daily mission misses.
    """
    now = datetime.utcnow()

    # Find active/in-progress missions that have passed expiry
    expired_missions: List[MissionProgress] = await MissionProgress.find(
        MissionProgress.expires_at <= now,
        MissionProgress.status.in_([MissionStatus.ACTIVE, MissionStatus.IN_PROGRESS]),
    ).to_list()

    daily_miss_farmers = set()

    for mp in expired_missions:
        mp.status = MissionStatus.EXPIRED
        await mp.save()

        # Notify farmer
        await send_notification(
            user_id=mp.farmer_id,
            notif_type=NotificationType.MISSION_EXPIRED,
            title="Mission Expired ⏰",
            message="A mission expired before you could complete it.",
            link="/missions",
        )

        # Track daily mission misses for streak reset
        from app.models.mission import Mission, MissionType
        mission = await Mission.get(mp.mission_id)
        if mission and mission.mission_type == MissionType.DAILY:
            daily_miss_farmers.add(mp.farmer_id)

    # Reset streaks for daily mission misses
    for farmer_id in daily_miss_farmers:
        await reset_streak(farmer_id)

    logger.info(
        f"Mission expiry job: expired {len(expired_missions)} missions, "
        f"reset streaks for {len(daily_miss_farmers)} farmers"
    )


async def run_daily_mission_generation():
    """
    Daily midnight job: Assign fresh daily missions to all active farmers.
    Uses template missions from DB.
    """
    from app.models.farm_profile import FarmProfile
    from app.models.mission import Mission, MissionType

    farms: List[FarmProfile] = await FarmProfile.find_all().to_list()
    daily_missions: List[Mission] = await Mission.find(
        Mission.mission_type == MissionType.DAILY,
        Mission.is_active == True,
    ).to_list()

    if not daily_missions:
        logger.warning("No daily missions found in DB to assign!")
        return

    now = datetime.utcnow()
    expires_at = now + timedelta(hours=24)
    created = 0

    for farm in farms:
        # Assign first available daily mission (can be improved with personalization)
        mission = daily_missions[0]
        existing = await MissionProgress.find_one(
            MissionProgress.farmer_id == farm.farmer_id,
            MissionProgress.mission_id == str(mission.id),
            MissionProgress.expires_at >= now,
        )
        if not existing:
            mp = MissionProgress(
                farmer_id=farm.farmer_id,
                mission_id=str(mission.id),
                expires_at=expires_at,
            )
            await mp.insert()
            created += 1

    logger.info(f"Daily mission generation: created {created} mission assignments")
