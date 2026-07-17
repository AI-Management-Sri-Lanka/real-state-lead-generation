from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum


class Platform(str, Enum):
    instagram = "instagram"
    facebook = "facebook"
    google = "google"

class PropertyType(str, Enum):
    house = "house"
    apartment = "apartment"
    villa = "villa"
    land = "land"
    commercial = "commercial"
    rental = "rental"
    boarding = "boarding"
    farming = "farming"
    investment = "investment"
    unknown = "unknown"

class ScrapedLead(BaseModel):
    userId: str = Field(..., description="Platform handle / user ID of the post author")
    name: str = Field(..., description="Display name of the account")
    email: Optional[str] = Field(default=None, description="Contact email, if available")
    post_link: str = Field(..., description="Full URL to the original post")
    date: Optional[datetime] = Field(default=None, description="Post publication timestamp (UTC)")
    description: Optional[str] = Field(default=None, description="Post caption / body text")
    platform: Platform = Field(..., description="Social media platform the post was scraped from")
    property_type: PropertyType = Field(
        default=PropertyType.unknown,
        description="Classified real-estate property type"
    )
    location: Optional[str] = Field(default=None, description="Inferred or stated location")
