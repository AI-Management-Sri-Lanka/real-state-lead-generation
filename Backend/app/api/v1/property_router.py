from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import Property, PropertyImage, PropertyType, ListingType
from schemas import PropertyCreate, PropertyUpdate, PropertyResponse, PropertyImageCreate, PropertyImageResponse

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.post("/", response_model=PropertyResponse, status_code=201)
def create_property(payload: PropertyCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"images"})
    prop = Property(**data)
    for img in payload.images:
        prop.images.append(PropertyImage(**img.model_dump()))
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/", response_model=List[PropertyResponse])
def list_properties(
    property_type: Optional[PropertyType] = Query(None),
    listing_type: Optional[ListingType] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_beds: Optional[int] = Query(None),
    is_verified: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Property).options(joinedload(Property.images))

    if property_type:
        query = query.filter(Property.property_type == property_type)
    if listing_type:
        query = query.filter(Property.listing_type == listing_type)
    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)
    if min_beds is not None:
        query = query.filter(Property.bedrooms >= min_beds)
    if is_verified is not None:
        query = query.filter(Property.is_verified == is_verified)

    return query.offset(skip).limit(limit).all()


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = (
        db.query(Property)
        .options(joinedload(Property.images))
        .filter(Property.id == property_id)
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, payload: PropertyUpdate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=204)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()


# --- Image sub-routes ---

@router.post("/{property_id}/images", response_model=PropertyImageResponse, status_code=201)
def add_image(property_id: int, payload: PropertyImageCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    img = PropertyImage(property_id=property_id, **payload.model_dump())
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.delete("/{property_id}/images/{image_id}", status_code=204)
def delete_image(property_id: int, image_id: int, db: Session = Depends(get_db)):
    img = (
        db.query(PropertyImage)
        .filter(PropertyImage.id == image_id, PropertyImage.property_id == property_id)
        .first()
    )
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(img)
    db.commit()