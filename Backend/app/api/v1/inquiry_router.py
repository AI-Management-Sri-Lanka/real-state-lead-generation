from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.inquiry_schema import InquiryCreate, InquiryResponse
from app.schemas.response_schema import ResponseSchema
from app.services.inquiry_service import inquiry_service

router = APIRouter(prefix="/inquiries", tags=["Inquiries"])

@router.post("", response_model=ResponseSchema[InquiryResponse], status_code=201)
async def create_inquiry(payload: InquiryCreate, db: AsyncSession = Depends(get_db)):
    """Public endpoint to submit property inquiries or general contact form leads."""
    inquiry = await inquiry_service.create_inquiry(db, payload)
    
    # Safely fetch property title if property_id exists to avoid lazy-loading issues
    property_title = None
    if inquiry.property_id:
        from app.models.properties import Property
        prop = await db.get(Property, inquiry.property_id)
        if prop:
            property_title = prop.title

    # Map model to schema response
    response_data = InquiryResponse(
        id=inquiry.id,
        property_id=inquiry.property_id,
        property_title=property_title,
        name=inquiry.name,
        email=inquiry.email,
        phone=inquiry.phone,
        message=inquiry.message,
        source=inquiry.source,
        created_at=inquiry.created_at
    )
    return ResponseSchema(success=True, message="Inquiry submitted successfully", data=response_data)
