from app.models.chat import ChatMessage
from app.models.user import User
from app.middleware.ws_manager import manager
from datetime import datetime
from typing import List, Dict
import json

async def send_message(sender: User, receiver_id: str, content: str) -> dict:
    if not receiver_id or not content:
        raise ValueError("Receiver and content are required.")

    msg = ChatMessage(
        sender_id=str(sender.id),
        receiver_id=receiver_id,
        content=content
    )
    await msg.insert()

    # Real-time notification if recipient is online
    payload = {
        "type": "new_message",
        "data": {
            "id": str(msg.id),
            "sender_id": str(sender.id),
            "sender_name": sender.name,
            "content": content,
            "created_at": msg.created_at.isoformat()
        }
    }
    await manager.send_personal_message(json.dumps(payload), receiver_id)

    return {
        "id": str(msg.id),
        "sender_id": str(sender.id),
        "content": content,
        "created_at": msg.created_at.isoformat()
    }

async def get_history(user: User, other_id: str) -> List[dict]:
    # Use raw dictionary query for robustness
    messages = await ChatMessage.find({
        "$or": [
            {"sender_id": str(user.id), "receiver_id": other_id},
            {"sender_id": other_id, "receiver_id": str(user.id)}
        ]
    }).sort(+ChatMessage.created_at).to_list()
    
    # Mark messages as read
    await ChatMessage.find({
        "sender_id": other_id,
        "receiver_id": str(user.id),
        "is_read": False
    }).set({"is_read": True})

    return [
        {
            "id": str(m.id),
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()
        } for m in messages
    ]

async def get_inbox(user: User) -> List[dict]:
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"DEBUG: Getting inbox for user {user.id}")
    
    try:
        # Use raw query to avoid potential Beanie model initialization issues in the query phase
        messages = await ChatMessage.find(
            {"$or": [{"sender_id": str(user.id)}, {"receiver_id": str(user.id)}]}
        ).sort(-ChatMessage.created_at).to_list()
        logger.info(f"DEBUG: Found {len(messages)} total messages")
    except Exception as e:
        logger.error(f"DEBUG ERROR in .find(): {type(e).__name__}: {e}")
        raise e

    inbox_map = {}
    for m in messages:
        try:
            # Check if it's a dict or object
            if isinstance(m, dict):
                sid = m.get('sender_id')
                rid = m.get('receiver_id')
                content = m.get('content', '')
                created = m.get('created_at', datetime.utcnow())
                read = m.get('is_read', False)
            else:
                sid = getattr(m, 'sender_id', None)
                rid = getattr(m, 'receiver_id', None)
                content = getattr(m, 'content', '')
                created = getattr(m, 'created_at', datetime.utcnow())
                read = getattr(m, 'is_read', False)
            
            if not sid or not rid:
                logger.warning(f"DEBUG: Skipping message with missing fields: {m}")
                continue

            other_id = rid if sid == str(user.id) else sid
            
            if other_id not in inbox_map:
                logger.info(f"DEBUG: Fetching other user {other_id}")
                other_user = await User.get(other_id)
                inbox_map[other_id] = {
                    "user_id": other_id,
                    "name": other_user.name if other_user else "Unknown Farmer",
                    "avatar": other_user.profile_picture if other_user else None,
                    "last_message": content,
                    "created_at": created.isoformat() if hasattr(created, 'isoformat') else str(created),
                    "unread": not read and rid == str(user.id)
                }
            elif not read and rid == str(user.id):
                inbox_map[other_id]["unread"] = True
        except Exception as e:
            logger.error(f"DEBUG ERROR in loop: {type(e).__name__}: {e}")
            continue

    logger.info(f"DEBUG: Inbox map size: {len(inbox_map)}")
    return list(inbox_map.values())
