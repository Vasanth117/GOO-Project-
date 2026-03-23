from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Optional

class ChatMessage(Document):
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "chat_messages"
        indexes = [
            [("sender_id", 1), ("receiver_id", 1)],
            [("receiver_id", 1), ("sender_id", 1)],
            [("created_at", -1)]
        ]
