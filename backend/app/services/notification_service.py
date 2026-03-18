from app.models.notification import Notification, NotificationType
from typing import Optional
import logging

logger = logging.getLogger(__name__)


async def send_notification(
    user_id: str,
    notif_type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None,
):
    """Create a notification for a user."""
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        link=link,
    )
    await notif.insert()
    logger.info(f"Notification sent to {user_id}: [{notif_type.value}] {title}")
    return notif
