from fastapi import APIRouter, Depends, Query, Body, File, UploadFile
from app.schemas.marketplace_schema import CreateProductRequest, UpdateProductRequest, CreateOrderRequest
from app.controllers import marketplace_controller
from app.middleware.auth_middleware import get_current_user, require_seller, require_admin
from app.models.user import User
from app.models.order import OrderStatus
from app.utils.response_utils import success_response
from typing import Optional

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


# ─── BROWSE ──────────────────────────────────────────────────

@router.get("/products", summary="Browse products in marketplace")
async def get_products(
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    result = await marketplace_controller.get_products(
        category=category,
        min_price=min_price,
        max_price=max_price,
        search=search,
        page=page,
        limit=limit
    )
    return success_response(result)


@router.get("/products/{product_id}", summary="Get product details")
async def get_product_detail(product_id: str, current_user: User = Depends(get_current_user)):
    result = await marketplace_controller.get_product_detail(product_id)
    return success_response(result)


# ─── REVIEWS ─────────────────────────────────────────────────

@router.get("/products/{product_id}/reviews", summary="Get product reviews")
async def get_product_reviews(product_id: str, current_user: User = Depends(get_current_user)):
    result = await marketplace_controller.get_product_reviews(product_id)
    return success_response(result)


@router.post("/products/{product_id}/reviews", summary="Add a review for a product")
async def add_review(
    product_id: str,
    rating: int = Body(..., embed=True),
    comment: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
):
    result = await marketplace_controller.add_review(current_user, product_id, rating, comment)
    return success_response(result, "Review added")


@router.post("/reviews/{review_id}/reply", summary="Seller: Reply to a review")
async def reply_to_review(
    review_id: str,
    reply: str = Body(..., embed=True),
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.reply_to_review(review_id, current_user, reply)
    return success_response(result, "Reply saved")


# ─── ORDERS ──────────────────────────────────────────────────

@router.post("/orders", summary="Place an order for a product")
async def place_order(
    data: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    result = await marketplace_controller.place_order(current_user, data)
    return success_response(result, "Order placed successfully")


@router.get("/orders/me", summary="Buyer: View order tracking history")
async def get_my_orders(current_user: User = Depends(get_current_user)):
    result = await marketplace_controller.get_my_orders(current_user)
    return success_response(result)


# ─── SELLER / ADMIN ACTIONS ──────────────────────────────────

@router.get("/seller/dashboard", summary="Seller: Generate sales dashboard")
async def get_seller_dashboard(current_user: User = Depends(require_seller)):
    result = await marketplace_controller.get_seller_dashboard(current_user)
    return success_response(result)


@router.post("/products", summary="Seller/Admin: Create a product listing")
async def create_product(
    data: CreateProductRequest,
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.create_product(current_user, data)
    return success_response(result, "Product listing created")


@router.post("/products/upload", summary="Seller: Upload product image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.upload_product_image(current_user, file)
    return success_response(result, "Image uploaded")


@router.patch("/products/{product_id}", summary="Seller/Admin: Update product listing")
async def update_product(
    product_id: str,
    data: UpdateProductRequest,
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.update_product(product_id, current_user, data)
    return success_response(result, "Product updated")


@router.delete("/products/{product_id}", summary="Seller/Admin: Delete product")
async def delete_product(product_id: str, current_user: User = Depends(require_seller)):
    result = await marketplace_controller.delete_product(product_id, current_user)
    return success_response(result, "Product deleted")


@router.patch("/orders/{order_id}/status", summary="Seller: Update order status")
async def update_order_status(
    order_id: str,
    status: OrderStatus,
    current_user: User = Depends(require_seller),
):
    result = await marketplace_controller.update_order_status(order_id, current_user, status)
    return success_response(result, f"Order status updated to {status.value}")
