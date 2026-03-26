from app.models.notification import Notification, NotificationType
from app.middleware.ws_manager import manager
from typing import Optional
import logging
import json

logger = logging.getLogger(__name__)


async def send_notification(
    user_id: str,
    notif_type: NotificationType,
    title: str,
    message: str,
    link: Optional[str] = None,
):
    """Create a notification for a user and send via WebSocket if online."""
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        link=link,
    )
    await notif.insert()
    
    # Broadcast in real-time
    payload = {
        "type": "notification",
        "data": {
            "id": str(notif.id),
            "type": notif_type.value,
            "title": title,
            "message": message,
            "link": link,
            "is_read": False,
            "created_at": notif.created_at.isoformat(),
        }
    }
    
    try:
        await manager.send_personal_message(json.dumps(payload), str(user_id))
    except Exception as e:
        logger.error(f"Failed to push WS notification to {user_id}: {e}")

    logger.info(f"Notification sent to {user_id}: [{notif_type.value}] {title}")
    return notif
