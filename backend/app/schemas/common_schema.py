from pydantic import BaseModel
from typing import Optional, Any


class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    """Standard paginated response."""
    success: bool = True
    message: str = "Success"
    data: Optional[Any] = None
    page: int = 1
    limit: int = 20
    total: int = 0
    has_next: bool = False
