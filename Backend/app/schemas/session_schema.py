from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ── Lead / Buyer Profile ──────────────────────────────────────────────────────
class LeadProfile(BaseModel):
    platform: str = Field(..., example="facebook")          # facebook|instagram|tiktok
    platform_user_id: str = Field(..., example="fb_123456")
    lead_name: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_location: Optional[str] = None
    property_type: Optional[str] = None                     # house|apartment|land
    bedrooms: Optional[int] = None
    extra: Optional[dict] = {}


class LeadProfileUpdate(BaseModel):
    lead_name: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_location: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    extra: Optional[dict] = None


# ── Messages ──────────────────────────────────────────────────────────────────
class MessageIn(BaseModel):
    role: str = Field(..., example="user")                  # user | assistant
    content: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Session ───────────────────────────────────────────────────────────────────
class SessionCreate(BaseModel):
    user_id: int
    title: Optional[str] = "New Chat"


class SessionOut(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    title: str
    messages: List[MessageOut]
    created_at: datetime
    updated_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class SessionSummary(BaseModel):
    session_id: str
    user_id: Optional[int] = None
    title: str
    message_count: int
    updated_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True