from datetime import datetime, timedelta
from typing import List

from app.models.reward import Reward, RewardType
from app.models.farm_profile import FarmProfile
from app.models.user import User
from app.schemas.marketplace_schema import CreateVoucherRequest
from app.services.notification_service import send_notification
from app.models.notification import NotificationType
from app.utils.response_utils import error_response, not_found
import logging

logger = logging.getLogger(__name__)


async def get_reward_wallet(user: User) -> dict:
    """View points balance and earned vouchers."""
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        return {"total_points": 0, "tier": "beginner", "vouchers": []}

    vouchers = await Reward.find(
        Reward.farmer_id == str(user.id),
        Reward.is_redeemed == False,
    ).to_list()

    return {
        "total_points": farm.sustainability_score,
        "vouchers_count": len(vouchers),
        "vouchers": [
            {
                "id": str(v.id),
                "title": v.description,
                "points_cost": v.points_cost,
                "expires_at": (v.created_at + timedelta(days=30)).isoformat(), # default 30 days
            }
            for v in vouchers
        ]
    }


async def redeem_voucher(user: User, voucher_id: str) -> dict:
    """Redeem a specific voucher (mark as used)."""
    reward = await Reward.get(voucher_id)
    if not reward or reward.farmer_id != str(user.id):
        not_found("Voucher")

    if reward.is_redeemed:
        error_response("Voucher already redeemed", 400)

    reward.is_redeemed = True
    reward.redeemed_at = datetime.utcnow()
    await reward.save()

    return {"message": "Voucher redeemed successfully", "id": voucher_id}


async def admin_create_vouchers_for_points(user: User, data: CreateVoucherRequest) -> dict:
    """Farmer buys a reward voucher using their points."""
    farm = await FarmProfile.find_one(FarmProfile.farmer_id == str(user.id))
    if not farm:
        error_response("Farm profile required", 400)

    if farm.sustainability_score < data.points_cost:
        error_response("Not enough points", 400)

    # Deduct points
    farm.sustainability_score -= data.points_cost
    await farm.save()

    # Create reward voucher
    reward = Reward(
        farmer_id=str(user.id),
        reward_type=RewardType.VOUCHER,
        points_cost=data.points_cost,
        description=data.title,
        metadata={
            "description": data.description,
            "discount_percent": data.discount_percent,
            "discount_amount": data.discount_amount,
        }
    )
    await reward.insert()

    await send_notification(
        user_id=str(user.id),
        notif_type=NotificationType.REWARD_UNLOCKED,
        title="✨ Reward Unlocked!",
        message=f"You successfully redeemed {data.points_cost} points for: {data.title}",
        link="/rewards",
    )

    return {
        "id": str(reward.id),
        "title": reward.description,
        "remaining_points": farm.sustainability_score,
    }
