"""
Mission completion cascade service.
Called when a proof is approved (by expert or future AI).
Triggers: score update → streak update → badge check → notification → optional social post.
"""
from app.models.mission_progress import MissionProgress, MissionStatus
from app.models.mission import Mission
from app.models.proof_submission import ProofSubmission, ProofStatus
from app.models.post import Post
from app.models.score import ScoreChangeReason
from app.services.score_service import update_score
from app.services.streak_service import update_streak_on_activity
from app.services.badge_service import check_and_award_badges
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def complete_mission(
    mission_progress: MissionProgress,
    approved_by: str = "expert",
    auto_post: bool = False,
) -> dict:
    """
    Full mission completion cascade.
    Called after proof is approved.

    Returns dict with new score, streak, and earned items.
    """
    mission = await Mission.get(mission_progress.mission_id)
    if not mission:
        logger.error(f"Mission {mission_progress.mission_id} not found during completion")
        return {}

    # 1. Mark mission as completed
    mission_progress.status = MissionStatus.COMPLETED
    mission_progress.completed_at = datetime.utcnow()
    mission_progress.points_earned = mission.reward_points
    await mission_progress.save()

    farmer_id = mission_progress.farmer_id

    # 2. Update score
    new_score = await update_score(
        farmer_id=farmer_id,
        reason=ScoreChangeReason.MISSION_COMPLETE,
        custom_delta=mission.reward_points,
        description=f'Mission completed: "{mission.title}"',
    )

    # 3. Update streak
    streak = await update_streak_on_activity(farmer_id)

    # 4. Check badges
    await check_and_award_badges(farmer_id)

    # 5. Send notification
    await send_notification(
        user_id=farmer_id,
        notif_type=NotificationType.MISSION_COMPLETE,
        title="✅ Mission Complete!",
        message=f'"{mission.title}" — You earned {mission.reward_points} points!',
        link=f"/missions/history",
    )

    # 6. Optional: auto-create social post for mission completion
    if auto_post:
        post = Post(
            author_id=farmer_id,
            content=f'🎯 Just completed mission: "{mission.title}" and earned {mission.reward_points} points! 🌱',
            mission_progress_id=str(mission_progress.id),
            is_verified_post=True,
        )
        await post.insert()

    logger.info(
        f"Mission completed: {mission.title} | Farmer: {farmer_id} | "
        f"Points: +{mission.reward_points} | New score: {new_score}"
    )

    return {
        "mission_title": mission.title,
        "points_earned": mission.reward_points,
        "new_score": new_score,
        "current_streak": streak.current_streak,
    }
