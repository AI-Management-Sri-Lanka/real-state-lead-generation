from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta

from app.models.user import User
from app.models.properties import Property
from app.models.session import Session
from app.models.inquiry import Inquiry


async def get_platform_stats(db: AsyncSession) -> dict:
    """Get enriched aggregate statistics across the platform for the admin dashboard."""

    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # --- User stats ---
    total_users = await db.scalar(select(func.count(User.id))) or 0
    active_users = await db.scalar(
        select(func.count(User.id)).where(User.is_active == True)
    ) or 0
    inactive_users = total_users - active_users
    new_users_last_7 = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= seven_days_ago)
    ) or 0

    # --- Property stats ---
    total_properties = await db.scalar(select(func.count(Property.id))) or 0
    verified_properties = await db.scalar(
        select(func.count(Property.id)).where(Property.is_verified == True)
    ) or 0
    unverified_properties = total_properties - verified_properties

    # --- Properties by type breakdown (uses property_type column) ---
    type_rows = await db.execute(
        select(Property.property_type, func.count(Property.id))
        .group_by(Property.property_type)
    )
    properties_by_type = {str(row[0].value): row[1] for row in type_rows.all()}

    # --- Session stats ---
    total_sessions = await db.scalar(select(func.count(Session.id))) or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "new_users_last_7_days": new_users_last_7,
        "total_properties": total_properties,
        "verified_properties": verified_properties,
        "unverified_properties": unverified_properties,
        "properties_by_type": properties_by_type,
        "total_chat_sessions": total_sessions,
    }


async def get_inquiry_analytics(db: AsyncSession) -> dict:
    """Get advanced inquiry and lead generation analytics for the master admin."""
    
    # 1. Total leads
    total_leads = await db.scalar(select(func.count(Inquiry.id))) or 0
    
    # 2. Leads by source
    source_rows = await db.execute(
        select(Inquiry.source, func.count(Inquiry.id))
        .group_by(Inquiry.source)
    )
    leads_by_source = {str(row[0]): row[1] for row in source_rows.all()}
    
    # 3. Top Properties by leads
    top_props_rows = await db.execute(
        select(Property.id, Property.title, func.count(Inquiry.id).label("lead_count"))
        .join(Inquiry, Inquiry.property_id == Property.id)
        .group_by(Property.id, Property.title)
        .order_by(desc("lead_count"))
        .limit(10)
    )
    top_properties = [{"property_id": row[0], "title": row[1], "lead_count": row[2]} for row in top_props_rows.all()]
    
    # 4. Top Owners by leads
    top_owners_rows = await db.execute(
        select(User.id, User.full_name, func.count(Inquiry.id).label("lead_count"))
        .join(Property, Property.owner_id == User.id)
        .join(Inquiry, Inquiry.property_id == Property.id)
        .group_by(User.id, User.full_name)
        .order_by(desc("lead_count"))
        .limit(10)
    )
    top_owners = [{"user_id": row[0], "full_name": row[1], "lead_count": row[2]} for row in top_owners_rows.all()]

    return {
        "total_leads": total_leads,
        "leads_by_source": leads_by_source,
        "top_properties": top_properties,
        "top_owners": top_owners
    }
