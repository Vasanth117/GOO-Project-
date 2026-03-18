from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AdvisorChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    context: Optional[Dict[str, Any]] = None  # Optional environmental context


class AdvisorResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    referenced_data: Optional[Dict[str, Any]] = None


class CropRecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    current_crops: List[str] = []


class CropRecommendationResponse(BaseModel):
    recommended_crops: List[Dict[str, Any]]
    reasoning: str
    planting_window: str


class ProofAnalysisResponse(BaseModel):
    is_valid: bool
    confidence: float
    analysis_notes: str
    detected_objects: List[str]
    sustainability_rating: int = Field(..., ge=1, le=10)
