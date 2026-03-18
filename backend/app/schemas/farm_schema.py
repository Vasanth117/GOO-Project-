from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.farm_profile import (
    SoilType, IrrigationType, FarmingPractice,
    Location, FertilizerUsage, PesticideUsage
)


class CreateFarmRequest(BaseModel):
    farm_name: str = Field(..., min_length=2, max_length=100)
    location: Location
    farm_size_acres: float = Field(..., gt=0)
    soil_type: SoilType
    crop_types: List[str] = Field(..., min_length=1)
    irrigation_type: IrrigationType
    fertilizer_usage: FertilizerUsage
    pesticide_usage: PesticideUsage
    farming_practices: FarmingPractice = FarmingPractice.CONVENTIONAL

    class Config:
        json_schema_extra = {
            "example": {
                "farm_name": "Ravi's Green Farm",
                "location": {"latitude": 11.1271, "longitude": 78.6569},
                "farm_size_acres": 5.0,
                "soil_type": "loam",
                "crop_types": ["rice", "wheat"],
                "irrigation_type": "drip",
                "fertilizer_usage": {"type": "organic", "quantity_per_week_kg": 10},
                "pesticide_usage": {"type": "none", "quantity_per_week_liters": 0},
                "farming_practices": "organic"
            }
        }


class UpdateFarmRequest(BaseModel):
    farm_name: Optional[str] = None
    farm_size_acres: Optional[float] = None
    soil_type: Optional[SoilType] = None
    crop_types: Optional[List[str]] = None
    irrigation_type: Optional[IrrigationType] = None
    fertilizer_usage: Optional[FertilizerUsage] = None
    pesticide_usage: Optional[PesticideUsage] = None
    farming_practices: Optional[FarmingPractice] = None


class WeeklyCheckinRequest(BaseModel):
    fertilizer_type: str
    fertilizer_quantity_kg: float = Field(..., ge=0)
    pesticide_type: str
    pesticide_quantity_liters: float = Field(..., ge=0)
    water_usage_liters: float = Field(..., ge=0)
    notes: Optional[str] = None


class FarmResponse(BaseModel):
    id: str
    farm_name: str
    location: Location
    farm_size_acres: float
    soil_type: str
    crop_types: List[str]
    irrigation_type: str
    farming_practices: str
    sustainability_score: int
    created_at: str
