from beanie import Document, Link
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SoilType(str, Enum):
    CLAY = "clay"
    SANDY = "sandy"
    LOAM = "loam"
    SILT = "silt"
    PEAT = "peat"
    CHALK = "chalk"


class IrrigationType(str, Enum):
    DRIP = "drip"
    FLOOD = "flood"
    SPRINKLER = "sprinkler"
    RAIN_FED = "rain_fed"
    MANUAL = "manual"


class FarmingPractice(str, Enum):
    ORGANIC = "organic"
    CONVENTIONAL = "conventional"
    MIXED = "mixed"
    SUSTAINABLE = "sustainable"
    INTEGRATED = "integrated"


from pydantic import BaseModel
class Location(BaseModel):
    latitude: float
    longitude: float


class FertilizerUsage(BaseModel):
    type: str  # organic / chemical / mixed
    quantity_per_week_kg: float = 0.0


class PesticideUsage(BaseModel):
    type: str  # none / organic / chemical
    quantity_per_week_liters: float = 0.0


class HistoryLog(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    note: Optional[str] = None


class FarmProfile(Document):
    farmer_id: str  # references User._id
    farm_name: str
    location: Location
    farm_size_acres: float
    soil_type: SoilType
    crop_types: List[str] = []
    irrigation_type: IrrigationType
    fertilizer_usage: FertilizerUsage
    pesticide_usage: PesticideUsage
    farming_practices: FarmingPractice = FarmingPractice.CONVENTIONAL
    sustainability_score: int = 100
    history_logs: List[HistoryLog] = []
    last_checkin_at: Optional[datetime] = None
    
    # 🌍 SNAPPY MAP FIELDS
    live_lat: Optional[float] = None
    live_lng: Optional[float] = None
    last_seen_at: Optional[datetime] = None
    privacy_mode: str = "live" # live, farm_only, ghost
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "farm_profiles"
