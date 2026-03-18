from app.models.streak import Streak
from app.models.score import ScoreChangeReason
from app.services.score_service import update_score
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def get_or_create_streak(farmer_id: str) -> Streak:
    """Get existing streak or create a new one."""
    streak = await Streak.find_one(Streak.farmer_id == farmer_id)
    if not streak:
        streak = Streak(farmer_id=farmer_id)
        await streak.insert()
    return streak


async def update_streak_on_activity(farmer_id: str) -> Streak:
    """
    Called when a farmer completes any mission.
    Increments streak if activity is within 24hr window.
    Awards bonus score on milestones.
    """
    streak = await get_or_create_streak(farmer_id)
    now = datetime.utcnow()

    if streak.last_activity_date:
        hours_since = (now - streak.last_activity_date).total_seconds() / 3600

        if hours_since <= 48:  # still within streak window
            streak.current_streak += 1
        else:
            # Streak broken
            streak.current_streak = 1
            await send_notification(
                user_id=farmer_id,
                notif_type=NotificationType.STREAK_BROKEN,
                title="Streak Broken 😢",
                message="You missed a day and your streak was reset.",
            )
    else:
        streak.current_streak = 1

    # Update longest streak record
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.last_activity_date = now
    streak.updated_at = now
    await streak.save()

    # Milestone bonuses
    milestones = {7: "7-Day Streak! 🔥", 30: "30-Day Streak! 🌟", 100: "100-Day Legend! 🏆"}
    if streak.current_streak in milestones:
        await update_score(
            farmer_id=farmer_id,
            reason=ScoreChangeReason.STREAK_BONUS,
            description=f"Streak milestone: {milestones[streak.current_streak]}",
        )
        await send_notification(
            user_id=farmer_id,
            notif_type=NotificationType.STREAK_MILESTONE,
            title=f"🔥 Streak Milestone!",
            message=milestones[streak.current_streak],
        )

    logger.info(f"Streak updated for {farmer_id}: {streak.current_streak} days")
    return streak


async def reset_streak(farmer_id: str):
    """Force-reset a farmer's streak (called by cron on expired missions)."""
    streak = await get_or_create_streak(farmer_id)
    if streak.current_streak > 0:
        streak.streak_broken_count += 1
        streak.current_streak = 0
        streak.updated_at = datetime.utcnow()
        await streak.save()
        await send_notification(
            user_id=farmer_id,
            notif_type=NotificationType.STREAK_BROKEN,
            title="Streak Reset",
            message="Your streak was reset due to missed daily mission.",
        )
