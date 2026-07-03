from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from app.models.properties import PropertyType, ListingType


class PropertyImageBase(BaseModel):
    url: str = Field(..., max_length=512, example="https://cdn.example.com/prop1.jpg")
    is_primary: bool = Field(default=False, serialization_alias="isPrimary", validation_alias="isPrimary")
    sort_order: int = Field(default=0, serialization_alias="sortOrder", validation_alias="sortOrder")


class PropertyImageCreate(PropertyImageBase):
    pass


class PropertyImageResponse(PropertyImageBase):
    id: int
    property_id: int

    class Config:
        from_attributes = True
        populate_by_name = True


class PropertyBase(BaseModel):
    title: str = Field(..., max_length=255, example="Spacious 2 Bedroom Apartment in Colombo 07")
    price: float = Field(..., gt=0, example=25000000)
    currency: str = Field(default="LKR", max_length=10)
    location: str = Field(..., max_length=255, example="Colombo 07")
    bedrooms: Optional[int] = Field(None, ge=0, example=2)
    bathrooms: Optional[int] = Field(None, ge=0, example=2)
    area_sqft: Optional[float] = Field(None, gt=0, example=1100, serialization_alias="areaSqft", validation_alias="areaSqft")
    land_size_perches: Optional[float] = Field(None, gt=0, example=10, serialization_alias="landSizePerches", validation_alias="landSizePerches")
    property_type: PropertyType = Field(..., example=PropertyType.apartment, serialization_alias="type", validation_alias="type")
    listing_type: ListingType = Field(..., example=ListingType.sale, serialization_alias="listingType", validation_alias="listingType")
    is_verified: bool = Field(default=False, serialization_alias="verified", validation_alias="verified")
    furnishing: Optional[str] = Field(None, example="Fully-Furnished")
    parking: Optional[str] = Field(None, max_length=255, example="1 Covered Parking")
    listed_by: Optional[str] = Field(None, max_length=255, example="John Doe", serialization_alias="listedBy", validation_alias="listedBy")
    description: Optional[str] = Field(None, max_length=1024, example="An excellent apartment...")


class PropertyCreate(PropertyBase):
    images: List[str] = Field(default=[])


class PropertyUpdate(BaseModel):
    price: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    location: Optional[str] = Field(None, max_length=255)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    area_sqft: Optional[float] = Field(None, gt=0, serialization_alias="areaSqft", validation_alias="areaSqft")
    land_size_perches: Optional[float] = Field(None, gt=0, serialization_alias="landSizePerches", validation_alias="landSizePerches")
    property_type: Optional[PropertyType] = Field(None, serialization_alias="type", validation_alias="type")
    listing_type: Optional[ListingType] = Field(None, serialization_alias="listingType", validation_alias="listingType")
    is_verified: Optional[bool] = Field(None, serialization_alias="verified", validation_alias="verified")
    furnishing: Optional[str] = None
    parking: Optional[str] = None
    listed_by: Optional[str] = Field(None, serialization_alias="listedBy", validation_alias="listedBy")
    description: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: str
    owner_id: Optional[int] = Field(None, serialization_alias="ownerId")
    images: List[str] = []

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        if isinstance(v, int):
            return f"prop-{v:03d}"
        return v

    @field_validator("images", mode="before")
    @classmethod
    def convert_images(cls, v):
        if not v:
            return []
        result = []
        for img in v:
            if hasattr(img, "url"):
                result.append(img.url)
            elif isinstance(img, dict) and "url" in img:
                result.append(img["url"])
            elif isinstance(img, str):
                result.append(img)
        return result

    class Config:
        from_attributes = True
        populate_by_name = True