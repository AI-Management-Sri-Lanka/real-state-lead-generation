from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class InquiryCreate(BaseModel):
    property_id: Optional[int] = Field(default=None, alias="propertyId", serialization_alias="propertyId", validation_alias="propertyId", description="Optional ID of the property being inquired about")
    name: str = Field(..., description="Full name of the inquirer")
    email: str = Field(..., description="Email address of the inquirer")
    phone: Optional[str] = Field(default=None, description="Phone number of the inquirer")
    message: Optional[str] = Field(default=None, description="Inquiry message details")
    source: Optional[str] = Field(default="contact_page", description="Source of the inquiry (e.g. contact_page, property_page)")

    class Config:
        populate_by_name = True

class InquiryResponse(BaseModel):
    id: int
    property_id: Optional[int] = Field(default=None, alias="propertyId", serialization_alias="propertyId", validation_alias="propertyId")
    property_title: Optional[str] = Field(default=None, alias="propertyTitle", serialization_alias="propertyTitle", validation_alias="propertyTitle")
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    source: str
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class LeadItemSchema(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    location: str
    amount: str
    score: str
    initials: str
    color: str
    created_at: datetime

class SourceBreakdownItem(BaseModel):
    source: str
    percentage: float
    amount: int
    color: str

class ScoreBreakdownItem(BaseModel):
    label: str
    percentage: float
    color: str

class OwnerDashboardStats(BaseModel):
    total_leads: int
    qualified_leads: int
    new_leads_today: int
    ai_match_rate: str = Field(..., alias="aiMatchRate", serialization_alias="aiMatchRate", validation_alias="aiMatchRate")
    leads_by_source: List[SourceBreakdownItem] = Field(..., alias="leadsBySource", serialization_alias="leadsBySource", validation_alias="leadsBySource")
    score_breakdown: List[ScoreBreakdownItem] = Field(..., alias="scoreBreakdown", serialization_alias="scoreBreakdown", validation_alias="scoreBreakdown")
    recent_leads: List[LeadItemSchema] = Field(..., alias="recentLeads", serialization_alias="recentLeads", validation_alias="recentLeads")

    class Config:
        populate_by_name = True
