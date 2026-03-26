from typing import Optional, List
import os
import aiofiles
from fastapi import UploadFile
from app.config import settings

from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.reward import Reward, RewardType
from app.models.user import User
from app.models.farm_profile import FarmProfile
from app.models.review import ProductReview
from app.schemas.marketplace_schema import CreateProductRequest, UpdateProductRequest, CreateOrderRequest
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.response_utils import error_response, not_found
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


# ─── PRODUCT ACTIONS ─────────────────────────────────────────

async def create_product(user: User, data: CreateProductRequest) -> dict:
    """Sellers or Admins create products."""
    product = Product(
        seller_id=str(user.id),
        name=data.name,
        description=data.description,
        category=data.category,
        price=data.price,
        stock=data.stock,
        image_url=data.image_url,
        is_goo_verified=data.is_goo_verified,
        is_featured=data.is_featured,
        is_eco_certified=getattr(data, "is_eco_certified", False),
        proof_images=getattr(data, "proof_images", []),
        discount_percent=getattr(data, "discount_percent", 0.0),
    )
    await product.insert()
    logger.info(f"Product {product.id} created by seller {user.id}")
    return await _product_to_dict(product)


async def upload_product_image(user: User, file: UploadFile) -> dict:
    """Uploads a product image and returns the relative URL."""
    if not file.filename:
        error_response("No file provided", 400)
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        error_response("Invalid file type. Use JPG, PNG or WEBP", 400)

    filename = f"product_{user.id}_{datetime.utcnow().timestamp()}{ext}"
    product_dir = os.path.join(settings.UPLOAD_DIR, "products")
    os.makedirs(product_dir, exist_ok=True)
    
    path = os.path.join(product_dir, filename)
    async with aiofiles.open(path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    return {"url": f"/uploads/products/{filename}"}


async def get_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
) -> dict:
    """Browse the marketplace."""
    query: dict = {"is_active": True}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price

    skip = (page - 1) * limit
    products = await Product.find(query).skip(skip).limit(limit).to_list()
    total = await Product.find(query).count()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "has_next": (skip + limit) < total,
        "products": [await _product_to_dict(p) for p in products],
    }


async def get_product_detail(product_id: str) -> dict:
    product = await Product.get(product_id)
    if not product:
        not_found("Product")
    
    # Track analytics
    product.views_count += 1
    await product.save()
    
    return await _product_to_dict(product)


async def update_product(product_id: str, user: User, data: UpdateProductRequest) -> dict:
    product = await Product.get(product_id)
    if not product:
        not_found("Product")
    
    if product.seller_id != str(user.id) and user.role.value != "admin":
        error_response("Unauthorized to update this product", 403)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    product.updated_at = datetime.utcnow()
    await product.save()
    return await _product_to_dict(product)


async def delete_product(product_id: str, user: User) -> dict:
    product = await Product.get(product_id)
    if not product:
        not_found("Product")
    
    if product.seller_id != str(user.id) and user.role.value != "admin":
        error_response("Unauthorized to delete this product", 403)

    await product.delete()
    return {"message": "Product deleted successfully"}


# ─── ORDER ACTIONS ───────────────────────────────────────────

async def place_order(user: User, data: CreateOrderRequest) -> dict:
    """Buy a product using cash or points."""
    product = await Product.get(data.product_id)
    if not product:
        not_found("Product")

    if product.stock < data.quantity:
        error_response("Insufficient stock", 400)

    # Calculate price with discount
    original_price = product.price
    if product.discount_percent > 0:
        original_price = original_price * (1 - product.discount_percent / 100.0)

    total_price = original_price * data.quantity
    points_used = 0
    final_cash_price = total_price

    # Point conversion: 100 points = $1
    if data.use_points:
        farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
        if not farm:
            error_response("Farm profile required to use points", 400)
        
        available_points = farm.sustainability_score
        needed_points = int(total_price * 100)
        
        points_used = min(available_points, needed_points)
        discount = points_used / 100.0
        final_cash_price = max(0, total_price - discount)
        
        # Deduct points from farm score
        farm.sustainability_score -= points_used
        await farm.save()

    # Create order
    order = Order(
        buyer_id=str(user.id),
        seller_id=product.seller_id,
        product_id=data.product_id,
        quantity=data.quantity,
        total_price=total_price,
        paid_with_points=points_used,
        final_cash_price=final_cash_price,
        status=OrderStatus.PENDING,
        buyer_name=user.name,
        shipping_address=getattr(data, "shipping_address", "No address provided"),
        phone=getattr(data, "phone", "")
    )
    await order.insert()

    # Reduce stock
    product.stock -= data.quantity
    product.sales_count += data.quantity
    await product.save()

    # Notify seller
    await send_notification(
        user_id=product.seller_id,
        notif_type=NotificationType.SYSTEM,
        title="🛍️ New Order!",
        message=f"You have a new order for {data.quantity}x {product.name}",
        link=f"/dashboard/orders",
    )

    return {
        "order_id": str(order.id),
        "status": order.status.value,
        "total_price": total_price,
        "points_used": points_used,
        "final_cash_price": final_cash_price,
    }


async def get_my_orders(user: User) -> List[dict]:
    """Returns the order history for a buyer."""
    orders = await Order.find(Order.buyer_id == str(user.id)).sort(-Order.placed_at).to_list()
    return [await _order_to_dict(o) for o in orders]


async def update_order_status(order_id: str, user: User, status: OrderStatus) -> dict:
    """Sellers update the status of an order."""
    order = await Order.get(order_id)
    if not order:
        not_found("Order")

    if order.seller_id != str(user.id) and user.role.value != "admin":
        error_response("Unauthorized to update this order", 403)

    order.status = status
    order.updated_at = datetime.utcnow()
    await order.save()

    # Notify buyer
    status_emoji = {
        OrderStatus.CONFIRMED: "✅",
        OrderStatus.SHIPPED: "🚚",
        OrderStatus.DELIVERED: "🎁",
        OrderStatus.CANCELLED: "❌"
    }.get(status, "📦")

    await send_notification(
        user_id=order.buyer_id,
        notif_type=NotificationType.SYSTEM,
        title=f"{status_emoji} Order Update!",
        message=f"Your order has been marked as {status.value.upper()}.",
        link=f"/marketplace/my-orders",
    )

    return {
        "order_id": str(order.id),
        "new_status": order.status.value
    }


# ─── SELLER DASHBOARD ────────────────────────────────────────

async def get_seller_dashboard(user: User) -> dict:
    """Returns detailed stats, income charts, and order management for a seller."""
    my_products = await Product.find(Product.seller_id == str(user.id)).to_list()
    
    # Orders logic
    all_orders = await Order.find(Order.seller_id == str(user.id)).sort(-Order.placed_at).to_list()
    
    # Stats
    total_earnings = sum([o.total_price for o in all_orders if o.status not in [OrderStatus.CANCELLED, OrderStatus.PENDING]])
    total_orders_count = len(all_orders)
    active_orders = [o for o in all_orders if o.status in [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED]]
    
    # Ratings
    product_ids = [str(p.id) for p in my_products]
    all_my_reviews = await ProductReview.find({"product_id": {"$in": product_ids}}).to_list()
    
    avg_rating = sum([r.rating for r in all_my_reviews]) / len(all_my_reviews) if all_my_reviews else 5.0

    # Earnings breakdown (Last 30 days)
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)
    recent_successful_orders = [o for o in all_orders if o.placed_at > last_30_days and o.status != OrderStatus.CANCELLED]
    
    daily_stats = {}
    for i in range(30):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[day] = 0
    
    for o in recent_successful_orders:
        day = o.placed_at.strftime("%Y-%m-%d")
        if day in daily_stats:
            daily_stats[day] += o.total_price

    return {
        "stats": {
            "total_products": len(my_products),
            "total_orders": total_orders_count,
            "total_earnings": total_earnings,
            "avg_rating": round(avg_rating, 1),
            "active_sales": len(active_orders)
        },
        "earnings_breakdown": [{"date": k, "amount": v} for k, v in sorted(daily_stats.items())],
        "recent_orders": [await _order_to_dict(o) for o in all_orders[:10]],
        "inventory": [await _product_to_dict(p) for p in my_products],
        "top_products": sorted([await _product_to_dict(p) for p in my_products], key=lambda x: x["sales"], reverse=True)[:5]
    }


# ─── REVIEW ACTIONS ──────────────────────────────────────────

async def add_review(user: User, product_id: str, rating: int, comment: str) -> dict:
    product = await Product.get(product_id)
    if not product:
        not_found("Product")
    
    review = ProductReview(
        product_id=product_id,
        user_id=str(user.id),
        user_name=user.name,
        rating=rating,
        comment=comment
    )
    await review.insert()
    return {"message": "Review added"}


async def get_product_reviews(product_id: str) -> List[dict]:
    reviews = await ProductReview.find(ProductReview.product_id == product_id).sort(-ProductReview.created_at).to_list()
    return [{
        "id": str(r.id),
        "user_name": r.user_name,
        "rating": r.rating,
        "comment": r.comment,
        "reply": r.reply,
        "created_at": r.created_at.isoformat()
    } for r in reviews]


async def reply_to_review(review_id: str, user: User, reply: str) -> dict:
    review = await ProductReview.get(review_id)
    if not review:
        not_found("Review")
    
    product = await Product.get(review.product_id)
    if product.seller_id != str(user.id):
        error_response("Only the seller can reply", 403)
    
    review.reply = reply
    await review.save()
    return {"message": "Reply saved"}


# ─── SERIALIZERS ──────────────────────────────────────────────

async def _product_to_dict(p: Product) -> dict:
    # Get reviews count and avg rating
    reviews = await ProductReview.find(ProductReview.product_id == str(p.id)).to_list()
    avg_r = sum([r.rating for r in reviews]) / len(reviews) if reviews else 0
    
    # Calculate price after discount
    final_price = p.price
    if p.discount_percent > 0:
        final_price = p.price * (1 - p.discount_percent / 100.0)

    return {
        "id": str(p.id),
        "seller_id": p.seller_id,
        "name": p.name,
        "description": p.description,
        "category": p.category,
        "price": p.price,
        "final_price": final_price,
        "discount_percent": p.discount_percent,
        "stock": p.stock,
        "image_url": p.image_url,
        "proof_images": p.proof_images,
        "is_goo_verified": p.is_goo_verified,
        "is_featured": p.is_featured,
        "views": p.views_count,
        "sales": p.sales_count,
        "rating": round(avg_r, 1),
        "review_count": len(reviews),
        "created_at": p.created_at.isoformat(),
    }


async def _order_to_dict(o: Order) -> dict:
    product = await Product.get(o.product_id)
    return {
        "id": str(o.id),
        "product_id": o.product_id,
        "product_name": product.name if product else "Unknown Product",
        "buyer_id": o.buyer_id,
        "buyer_name": o.buyer_name,
        "quantity": o.quantity,
        "total_price": o.total_price,
        "status": o.status.value,
        "shipping_address": o.shipping_address,
        "phone": o.phone,
        "created_at": o.placed_at.isoformat()
    }
