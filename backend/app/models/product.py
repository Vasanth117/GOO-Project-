from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProductCategory(str, Enum):
    FERTILIZER = "fertilizer"
    PESTICIDE = "pesticide"
    SEEDS = "seeds"
    TOOLS = "tools"
    IRRIGATION = "irrigation"
    CROP = "crop"
    CONSULTATION = "consultation"
    OTHER = "other"


class Product(Document):
    seller_id: str
    name: str
    description: str
    price: float
    category: ProductCategory
    image_url: Optional[str] = None
    proof_images: List[str] = []    # Photos of farming process, growth stages
    stock: int = 0
    is_goo_verified: bool = False   # True if seller has score > 500
    is_eco_certified: bool = False
    is_active: bool = True
    is_featured: bool = False
    discount_percent: float = 0.0
    
    # Analytics
    views_count: int = 0
    clicks_count: int = 0
    sales_count: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"
