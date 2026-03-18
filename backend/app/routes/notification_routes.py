from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.utils.response_utils import success_response, not_found
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", summary="Get all notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id)
    ).sort(-Notification.created_at).limit(50).to_list()

    unread = [n for n in notifications if not n.is_read]
    read = [n for n in notifications if n.is_read]

    def serialize(n: Notification):
        return {
            "id": str(n.id),
            "type": n.type.value,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }

    return success_response({
        "unread_count": len(unread),
        "unread": [serialize(n) for n in unread],
        "read": [serialize(n) for n in read],
    })


@router.patch("/{notif_id}/read", summary="Mark notification as read")
async def mark_read(notif_id: str, current_user: User = Depends(get_current_user)):
    notif = await Notification.get(notif_id)
    if not notif or notif.user_id != str(current_user.id):
        not_found("Notification")
    notif.is_read = True
    await notif.save()
    return success_response(None, "Marked as read")


@router.patch("/read-all", summary="Mark all notifications as read")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False,
    ).to_list()
    for n in notifications:
        n.is_read = True
        await n.save()
    return success_response(None, f"Marked {len(notifications)} notifications as read")
