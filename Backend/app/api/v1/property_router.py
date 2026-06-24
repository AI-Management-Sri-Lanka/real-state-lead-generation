from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.session import get_db
from app.models.properties import Property, PropertyImage, PropertyType, ListingType
from app.schemas.properties_schema import (
    PropertyCreate, PropertyUpdate, PropertyResponse, PropertyImageCreate, PropertyImageResponse
)
from app.services.property_manage import property_service

router = APIRouter(prefix="/properties", tags=["Properties"])


def parse_property_id(property_id: str) -> int:
    if property_id.startswith("prop-"):
        try:
            return int(property_id.replace("prop-", ""))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid property ID format")
    try:
        return int(property_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid property ID format")


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(payload: PropertyCreate, db: AsyncSession = Depends(get_db)):
    return await property_service.create_property(db, payload)


@router.get("", response_model=List[PropertyResponse])
async def list_properties(
    property_type: Optional[PropertyType] = Query(None, alias="type"),
    listing_type: Optional[ListingType] = Query(None, alias="listingType"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_beds: Optional[int] = Query(None),
    is_verified: Optional[bool] = Query(None, alias="verified"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await property_service.list_properties(
        db=db,
        property_type=property_type,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        min_beds=min_beds,
        is_verified=is_verified,
        skip=skip,
        limit=limit
    )


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str, db: AsyncSession = Depends(get_db)):
    int_id = parse_property_id(property_id)
    return await property_service.get_property(db, int_id)


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: str, payload: PropertyUpdate, db: AsyncSession = Depends(get_db)):
    int_id = parse_property_id(property_id)
    return await property_service.update_property(db, int_id, payload)


@router.delete("/{property_id}", status_code=204)
async def delete_property(property_id: str, db: AsyncSession = Depends(get_db)):
    int_id = parse_property_id(property_id)
    await property_service.delete_property(db, int_id)


# --- Image sub-routes ---

@router.post("/{property_id}/images", response_model=PropertyImageResponse, status_code=201)
async def add_image(property_id: str, payload: PropertyImageCreate, db: AsyncSession = Depends(get_db)):
    int_id = parse_property_id(property_id)
    return await property_service.add_image(db, int_id, payload)


@router.delete("/{property_id}/images/{image_id}", status_code=204)
async def delete_image(property_id: str, image_id: int, db: AsyncSession = Depends(get_db)):
    int_id = parse_property_id(property_id)
    await property_service.delete_image(db, int_id, image_id)