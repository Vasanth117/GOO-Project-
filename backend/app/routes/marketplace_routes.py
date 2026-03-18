from fastapi import APIRouter, Depends, Query
from app.schemas.marketplace_schema import CreateProductRequest, UpdateProductRequest, CreateOrderRequest
from app.controllers import marketplace_controller
from app.middleware.auth_middleware import get_current_user, require_seller, require_admin
from app.models.user import User
from app.utils.response_utils import success_response
from typing import Optional

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


# ─── BROWSE ──────────────────────────────────────────────────

@router.get("/products", summary="Browse products in marketplace")
async def get_products(
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    result = await marketplace_controller.get_products(
        category=category,
        min_price=min_price,
        max_price=max_price,
        page=page,
        limit=limit
    )
    return success_response(result)


@router.get("/products/{product_id}", summary="Get product details")
async def get_product_detail(product_id: str, current_user: User = Depends(get_current_user)):
    result = await marketplace_controller.get_product_detail(product_id)
    return success_response(result)


# ─── ORDERS ──────────────────────────────────────────────────

@router.post("/orders", summary="Place an order for a product")
async def place_order(
    data: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    result = await marketplace_controller.place_order(current_user, data)
    return success_response(result, "Order placed successfully")


# ─── SELLER / ADMIN ACTIONS ──────────────────────────────────

@router.post("/products", summary="Seller/Admin: Create a product listing")
async def create_product(
    data: CreateProductRequest,
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.create_product(current_user, data)
    return success_response(result, "Product listing created")


@router.patch("/products/{product_id}", summary="Seller/Admin: Update product listing")
async def update_product(
    product_id: str,
    data: UpdateProductRequest,
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.update_product(product_id, current_user, data)
    return success_response(result, "Product updated")
