from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from models import PropertyType, ListingType


class PropertyImageBase(BaseModel):
    url: str = Field(..., max_length=512, example="https://cdn.example.com/prop1.jpg")
    is_primary: bool = Field(default=False)
    sort_order: int = Field(default=0)


class PropertyImageCreate(PropertyImageBase):
    pass


class PropertyImageResponse(PropertyImageBase):
    id: int
    property_id: int

    class Config:
        from_attributes = True


class PropertyBase(BaseModel):
    title: str = Field(..., max_length=255, example="Spacious 2 Bedroom Apartment in Colombo 07")
    price: float = Field(..., gt=0, example=25000000)
    currency: str = Field(default="LKR", max_length=10)
    location: str = Field(..., max_length=255, example="Colombo 07")
    bedrooms: Optional[int] = Field(None, ge=0, example=2)
    bathrooms: Optional[int] = Field(None, ge=0, example=2)
    area_sqft: Optional[float] = Field(None, gt=0, example=1100)
    property_type: PropertyType = Field(..., example=PropertyType.apartment)
    listing_type: ListingType = Field(..., example=ListingType.for_sale)
    is_verified: bool = Field(default=False)
    furnishing: Optional[str] = Field(None, example="Fully-Furnished")
    parking: Optional[str] = Field(None, max_length=255, example="1 Covered Parking")
    listedBy: Optional[str] = Field(None, max_length=255, example="John Doe")
    description: Optional[str] = Field(None, max_length=1024, example="An excellent apartment located in the heart of Colombo with easy access to amenities and public transport.")


class PropertyCreate(PropertyBase):
    images: List[PropertyImageCreate] = Field(default=[])


class PropertyUpdate(BaseModel):
    price: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    location: Optional[str] = Field(None, max_length=255)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    area_sqft: Optional[float] = Field(None, gt=0)
    property_type: Optional[PropertyType] = None
    listing_type: Optional[ListingType] = None
    is_verified: Optional[bool] = None


class PropertyResponse(PropertyBase):
    id: int
    images: List[PropertyImageResponse] = []

    class Config:
        from_attributes = True