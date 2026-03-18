from fastapi import APIRouter, Depends
from app.schemas.marketplace_schema import CreateVoucherRequest
from app.controllers import reward_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/rewards", tags=["Rewards & Vouchers"])


@router.get("/wallet", summary="View points balance and active vouchers")
async def get_wallet(current_user: User = Depends(get_current_user)):
    result = await reward_controller.get_reward_wallet(current_user)
    return success_response(result)


@router.post("/redeem-points", summary="Redeem points for a voucher")
async def buy_voucher(
    data: CreateVoucherRequest,
    current_user: User = Depends(get_current_user),
):
    result = await reward_controller.admin_create_vouchers_for_points(current_user, data)
    return success_response(result, "Points redeemed for voucher")


@router.post("/vouchers/{voucher_id}/use", summary="Use (redeem) a voucher")
async def use_voucher(
    voucher_id: str,
    current_user: User = Depends(get_current_user),
):
    result = await reward_controller.redeem_voucher(current_user, voucher_id)
    return success_response(result)
