from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Order(Document):
    buyer_id: str
    seller_id: str
    product_id: str
    quantity: int
    total_price: float
    paid_with_points: int = 0
    final_cash_price: float
    status: OrderStatus = OrderStatus.PENDING
    
    # Shipping info
    buyer_name: Optional[str] = None
    shipping_address: Optional[str] = None
    phone: Optional[str] = None
    
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"
