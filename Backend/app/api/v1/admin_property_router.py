"""
Admin Property Router
Provides Master Admin with full CRUD + verify control over all properties,
bypassing the owner_id restriction enforced on regular user endpoints.
"""
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.db.session import get_db
from app.core.response import ok
from app.core.errors import AppException, AppError
from app.services.dependencies.deps import require_master_admin
from app.services.property_manage import property_service
from app.models.properties import PropertyType, ListingType
from app.schemas.properties_schema import (
    PropertyCreate, PropertyUpdate, PropertyResponse, PropertyImageCreate, PropertyImageResponse
)
from app.schemas.response_schema import ResponseSchema

router = APIRouter(prefix="/admin/properties", tags=["Admin — Properties"])


def parse_property_id(property_id: str) -> int:
    if property_id.startswith("prop-"):
        try:
            return int(property_id.replace("prop-", ""))
        except ValueError:
            raise AppException(error=AppError.VALIDATION_ERROR, custom_message="Invalid property ID format")
    try:
        return int(property_id)
    except ValueError:
        raise AppException(error=AppError.VALIDATION_ERROR, custom_message="Invalid property ID format")


@router.get("", response_model=ResponseSchema[List[PropertyResponse]])
async def admin_list_all_properties(
    property_type: Optional[PropertyType] = Query(None, alias="type"),
    listing_type: Optional[ListingType] = Query(None, alias="listingType"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_beds: Optional[int] = Query(None),
    is_verified: Optional[bool] = Query(None, alias="verified"),
    owner_id: Optional[int] = Query(None, alias="ownerId"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: List all properties across all owners, with full owner profile embedded."""
    data = await property_service.list_properties(
        db=db,
        property_type=property_type,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        min_beds=min_beds,
        is_verified=is_verified,
        owner_id=owner_id,
        skip=skip,
        limit=limit,
    )
    return ResponseSchema(success=True, message="Properties retrieved successfully", data=data)


@router.post("", response_model=ResponseSchema[PropertyResponse], status_code=201)
async def admin_create_property(
    payload: PropertyCreate,
    owner_id: Optional[int] = Query(None, alias="ownerId", description="Assign property to this user ID. Defaults to 0 (admin-owned)."),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Create a property, optionally on behalf of a specific property owner."""
    # Use provided owner_id or default to admin-context (0 means no linked owner)
    effective_owner_id = owner_id if owner_id is not None else 0
    data = await property_service.create_property(db, payload, effective_owner_id)
    return ResponseSchema(success=True, message="Property created successfully", data=data)


@router.get("/{property_id}", response_model=ResponseSchema[PropertyResponse])
async def admin_get_property(
    property_id: str = Path(...),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Get a single property by ID."""
    int_id = parse_property_id(property_id)
    data = await property_service.get_property(db, int_id)
    return ResponseSchema(success=True, message="Property retrieved successfully", data=data)


@router.patch("/{property_id}", response_model=ResponseSchema[PropertyResponse])
async def admin_update_property(
    property_id: str,
    payload: PropertyUpdate,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Edit any property regardless of who owns it."""
    int_id = parse_property_id(property_id)
    data = await property_service.update_property(
        db, int_id, payload, actor_id=_admin["admin_id"], is_admin=True
    )
    return ResponseSchema(success=True, message="Property updated successfully", data=data)


@router.delete("/{property_id}", status_code=204)
async def admin_delete_property(
    property_id: str,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Delete any property regardless of who owns it."""
    int_id = parse_property_id(property_id)
    await property_service.delete_property(
        db, int_id, actor_id=_admin["admin_id"], is_admin=True
    )


@router.post("/{property_id}/verify", response_model=ResponseSchema[PropertyResponse])
async def admin_verify_property(
    property_id: str,
    verified: bool = Query(True, description="Set to true to verify, false to un-verify"),
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Mark a property as verified (or un-verify it). Verified listings get a badge on the frontend."""
    int_id = parse_property_id(property_id)
    # Use model_validate with alias key since is_verified has validation_alias="verified"
    payload = PropertyUpdate.model_validate({"verified": verified})
    data = await property_service.update_property(
        db, int_id, payload, actor_id=_admin["admin_id"], is_admin=True
    )
    return ResponseSchema(success=True, message="Property verified successfully", data=data)


@router.post("/{property_id}/images", response_model=ResponseSchema[PropertyImageResponse], status_code=201)
async def admin_add_image(
    property_id: str,
    payload: PropertyImageCreate,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Add an image to any property."""
    int_id = parse_property_id(property_id)
    data = await property_service.add_image(
        db, int_id, payload, actor_id=_admin["admin_id"], is_admin=True
    )
    return ResponseSchema(success=True, message="Image added successfully", data=data)


@router.delete("/{property_id}/images/{image_id}", status_code=204)
async def admin_delete_image(
    property_id: str,
    image_id: int,
    _admin: dict = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: Remove an image from any property."""
    int_id = parse_property_id(property_id)
    await property_service.delete_image(
        db, int_id, image_id, actor_id=_admin["admin_id"], is_admin=True
    )
