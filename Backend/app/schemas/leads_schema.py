from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.schemas.lead_schema import Platform, PropertyType


class LeadResponse(BaseModel):
    id: int
    external_user_id: str = Field(..., serialization_alias="userId")
    name: str
    email: Optional[str] = None
    post_link: str = Field(..., serialization_alias="postLink")
    post_date: Optional[datetime] = Field(None, serialization_alias="date")
    description: Optional[str] = None
    platform: Platform
    property_type: PropertyType = Field(..., serialization_alias="propertyType")
    location: Optional[str] = None
    match_score: Optional[float] = Field(None, serialization_alias="matchScore")
    score_bucket: str = Field(..., serialization_alias="score")
    created_at: datetime = Field(..., serialization_alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True


class SourceBreakdown(BaseModel):
    source: str
    count: int
    percentage: float


class LeadsStats(BaseModel):
    total: int
    new_today: int = Field(..., serialization_alias="newToday")
    new_this_week: int = Field(..., serialization_alias="newThisWeek")
    qualified: int
    avg_match_score_pct: Optional[float] = Field(None, serialization_alias="avgMatchScorePct")
    by_source: List[SourceBreakdown] = Field(..., serialization_alias="bySource")

    class Config:
        populate_by_name = True
