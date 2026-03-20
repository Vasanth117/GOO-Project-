from fastapi import APIRouter, Depends
from app.schemas.farm_schema import CreateFarmRequest, UpdateFarmRequest, WeeklyCheckinRequest
from app.controllers import farm_controller
from app.middleware.auth_middleware import get_current_user, require_farmer, require_expert
from app.models.user import User
from app.utils.response_utils import success_response

router = APIRouter(prefix="/farm", tags=["Farm Profile"])


@router.post("/create", summary="Create farm profile (Farmer only)")
async def create_farm(
    data: CreateFarmRequest,
    current_user: User = Depends(require_farmer),
):
    result = await farm_controller.create_farm(current_user, data)
    return success_response(result, "Farm profile created successfully")


@router.get("/me", summary="Get my farm profile")
async def get_my_farm(current_user: User = Depends(require_farmer)):
    result = await farm_controller.get_my_farm(current_user)
    return success_response(result)


@router.get("/{farm_id}", summary="Get any farm profile (Expert/Admin)")
async def get_farm(
    farm_id: str,
    current_user: User = Depends(require_expert),
):
    result = await farm_controller.get_farm_by_id(farm_id)
    return success_response(result)


@router.put("/update", summary="Update farm profile")
async def update_farm(
    data: UpdateFarmRequest,
    current_user: User = Depends(require_farmer),
):
    result = await farm_controller.update_farm(current_user, data)
    return success_response(result, "Farm profile updated")


@router.post("/checkin", summary="Submit weekly check-in")
async def weekly_checkin(
    data: WeeklyCheckinRequest,
    current_user: User = Depends(require_farmer),
):
    result = await farm_controller.weekly_checkin(current_user, data)
    return success_response(result, "Check-in recorded")


@router.get("/nearby", summary="Get nearby farmers for Map")
async def get_nearby_farms(
    lat: float = 0.0,
    lng: float = 0.0,
    radius_km: float = 100.0,
    current_user: User = Depends(get_current_user),
):
    result = await farm_controller.get_nearby_farms(lat, lng, radius_km)
    return success_response(result)
