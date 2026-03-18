from app.models.farm_profile import FarmProfile
from app.models.score import ScoreChangeReason
from app.services.score_service import update_score
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def run_score_decay():
    """
    Nightly job: Apply score decay to farmers who haven't checked in.
    - 7 days inactive  → -10 points
    - 14 days inactive → -25 points
    - 30 days inactive → -50 points
    """
    now = datetime.utcnow()
    thresholds = [
        (timedelta(days=30), -50, "30 days inactive"),
        (timedelta(days=14), -25, "14 days inactive"),
        (timedelta(days=7),  -10, "7 days inactive"),
    ]

    farms = await FarmProfile.find_all().to_list()
    processed = 0

    for farm in farms:
        last_activity = farm.last_checkin_at or farm.created_at
        inactive_duration = now - last_activity

        for threshold, delta, reason_text in thresholds:
            if inactive_duration >= threshold:
                await update_score(
                    farmer_id=farm.farmer_id,
                    reason=ScoreChangeReason.INACTIVITY_DECAY,
                    custom_delta=delta,
                    description=f"Score decay: {reason_text}",
                )
                await send_notification(
                    user_id=farm.farmer_id,
                    notif_type=NotificationType.SCORE_DECAY,
                    title="⚠️ Score Dropping!",
                    message=f"You've been inactive for too long. Complete a mission to stop the decay!",
                    link="/missions",
                )
                processed += 1
                break  # Apply only the most severe threshold

    logger.info(f"Score decay job: processed {processed} farms")
