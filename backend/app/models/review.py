from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class ProductReview(Document):
    product_id: str
    user_id: str
    user_name: str
    rating: int = 5  # 1-5
    comment: str
    reply: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "product_reviews"
