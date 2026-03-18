from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── PRODUCT SCHEMAS ─────────────────────────────────────────

class CreateProductRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10)
    category: str = Field(..., pattern="^(seeds|fertilizer|tools|consultation|other)$")
    price: float = Field(..., ge=0)
    stock: int = Field(..., ge=0)
    image_url: Optional[str] = None
    is_goo_verified: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Organic Neem Fertilizer",
                "description": "100% natural neem-based fertilizer for pest control and soil health.",
                "category": "fertilizer",
                "price": 25.50,
                "stock": 100,
                "is_goo_verified": True
            }
        }


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    is_goo_verified: Optional[bool] = None


# ─── ORDER SCHEMAS ───────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)
    use_points: bool = False  # If true, try to pay with points (100 pts = $1)

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": "product_id_here",
                "quantity": 2,
                "use_points": True
            }
        }


# ─── REWARD SCHEMAS ──────────────────────────────────────────

class CreateVoucherRequest(BaseModel):
    title: str
    description: str
    points_cost: int = Field(..., ge=10)
    discount_percent: Optional[int] = None
    discount_amount: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "10% Off Seeds",
                "description": "Get 10% discount on any seed purchase.",
                "points_cost": 50,
                "discount_percent": 10
            }
        }


# ─── RESPONSE SCHEMAS ────────────────────────────────────────

class ProductResponse(BaseModel):
    id: str
    seller_id: str
    name: str
    description: str
    category: str
    price: float
    stock: int
    image_url: Optional[str]
    is_goo_verified: bool
    created_at: str


class OrderResponse(BaseModel):
    id: str
    buyer_id: str
    product_id: str
    quantity: int
    total_price: float
    paid_with_points: int
    status: str
    created_at: str


class RewardWalletResponse(BaseModel):
    total_points: int
    vouchers_count: int
    vouchers: List[dict]
