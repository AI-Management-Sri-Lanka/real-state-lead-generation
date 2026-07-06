from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from typing import Optional, List
from app.models.properties import Property, PropertyImage, PropertyType, ListingType
from app.schemas.properties_schema import PropertyCreate, PropertyUpdate, PropertyImageCreate


def _property_query():
    """Base query that eager-loads both images and owner profile."""
    return select(Property).options(
        selectinload(Property.images),
        selectinload(Property.owner),
    )


async def create_property(db: AsyncSession, payload: PropertyCreate, owner_id: int) -> Property:
    data = payload.model_dump(exclude={"images"})
    prop = Property(**data, owner_id=owner_id)
    for idx, img_url in enumerate(payload.images):
        prop.images.append(PropertyImage(url=img_url, is_primary=(idx == 0), sort_order=idx))
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    # Re-fetch to load images + owner relationship
    result = await db.execute(_property_query().where(Property.id == prop.id))
    return result.scalar_one()


async def get_property(db: AsyncSession, property_id: int) -> Property:
    result = await db.execute(_property_query().where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


async def list_properties(
    db: AsyncSession,
    property_type: Optional[PropertyType] = None,
    listing_type: Optional[ListingType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_beds: Optional[int] = None,
    is_verified: Optional[bool] = None,
    owner_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 20,
) -> List[Property]:
    query = _property_query()

    if property_type:
        query = query.where(Property.property_type == property_type)
    if listing_type:
        query = query.where(Property.listing_type == listing_type)
    if min_price is not None:
        query = query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
    if min_beds is not None:
        query = query.where(Property.bedrooms >= min_beds)
    if is_verified is not None:
        query = query.where(Property.is_verified == is_verified)
    if owner_id is not None:
        query = query.where(Property.owner_id == owner_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_property(
    db: AsyncSession,
    property_id: int,
    payload: PropertyUpdate,
    actor_id: int,
    is_admin: bool = False,
) -> Property:
    prop = await get_property(db, property_id)
    if not is_admin and prop.owner_id != actor_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this property")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)
    await db.commit()
    await db.refresh(prop)
    # Re-fetch to reload relationships after update
    result = await db.execute(_property_query().where(Property.id == prop.id))
    return result.scalar_one()


async def delete_property(
    db: AsyncSession,
    property_id: int,
    actor_id: int,
    is_admin: bool = False,
) -> None:
    prop = await get_property(db, property_id)
    if not is_admin and prop.owner_id != actor_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this property")
    await db.delete(prop)
    await db.commit()


async def add_image(
    db: AsyncSession,
    property_id: int,
    payload: PropertyImageCreate,
    actor_id: int,
    is_admin: bool = False,
) -> PropertyImage:
    prop = await get_property(db, property_id)
    if not is_admin and prop.owner_id != actor_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this property")
    img = PropertyImage(property_id=property_id, **payload.model_dump())
    db.add(img)
    await db.commit()
    await db.refresh(img)
    return img


async def delete_image(
    db: AsyncSession,
    property_id: int,
    image_id: int,
    actor_id: int,
    is_admin: bool = False,
) -> None:
    prop = await get_property(db, property_id)
    if not is_admin and prop.owner_id != actor_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this property")

    result = await db.execute(
        select(PropertyImage).where(
            PropertyImage.id == image_id,
            PropertyImage.property_id == property_id
        )
    )
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    await db.delete(img)
    await db.commit()