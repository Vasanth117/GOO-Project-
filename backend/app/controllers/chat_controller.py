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
    messages = await ChatMessage.find(
        ( (ChatMessage.sender_id == str(user.id)) & (ChatMessage.receiver_id == other_id) ) |
        ( (ChatMessage.sender_id == other_id) & (ChatMessage.receiver_id == str(user.id)) )
    ).sort(+ChatMessage.created_at).to_list()
    
    # Mark messages as read
    await ChatMessage.find(
        (ChatMessage.sender_id == other_id) & 
        (ChatMessage.receiver_id == str(user.id)) & 
        (ChatMessage.is_read == False)
    ).set({ChatMessage.is_read: True})

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
    # Find all unique people this user has shared messages with
    # In Beanie, simplified: get all messages, then unique users
    messages = await ChatMessage.find(
        (ChatMessage.sender_id == str(user.id)) | (ChatMessage.receiver_id == str(user.id))
    ).sort(-ChatMessage.created_at).to_list()

    inbox_map = {}
    for m in messages:
        other_id = m.receiver_id if m.sender_id == str(user.id) else m.sender_id
        if other_id not in inbox_map:
            other_user = await User.get(other_id)
            inbox_map[other_id] = {
                "user_id": other_id,
                "name": other_user.name if other_user else "Unknown Farmer",
                "avatar": other_user.profile_picture if other_user else None,
                "last_message": m.content,
                "created_at": m.created_at.isoformat(),
                "unread": not m.is_read and m.receiver_id == str(user.id)
            }
        elif not m.is_read and m.receiver_id == str(user.id):
            inbox_map[other_id]["unread"] = True

    return list(inbox_map.values())
