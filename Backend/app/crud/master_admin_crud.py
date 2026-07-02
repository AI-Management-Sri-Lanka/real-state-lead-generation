from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.master_admin import MasterAdmin
from app.schemas.master_admin_schema import MasterAdminCreate
from app.core.security import hash_password

async def has_any_admins(db: AsyncSession) -> bool:
    """Check if any master admin exists in the database."""
    result = await db.execute(select(MasterAdmin).limit(1))
    return result.scalar_one_or_none() is not None

async def create_admin(db: AsyncSession, admin_in: MasterAdminCreate, commit: bool = True) -> MasterAdmin:
    """Create a new master admin."""
    hashed_password = hash_password(admin_in.password)
    db_admin = MasterAdmin(
        full_name=admin_in.full_name,
        email=admin_in.email,
        hashed_password=hashed_password
    )
    db.add(db_admin)
    if commit:
        await db.commit()
        await db.refresh(db_admin)
    return db_admin

async def get_admin_by_email(db: AsyncSession, email: str) -> MasterAdmin | None:
    """Get a master admin by email."""
    result = await db.execute(select(MasterAdmin).where(MasterAdmin.email == email))
    return result.scalar_one_or_none()

async def get_admin_by_id(db: AsyncSession, admin_id: int) -> MasterAdmin | None:
    """Get a master admin by ID."""
    result = await db.execute(select(MasterAdmin).where(MasterAdmin.id == admin_id))
    return result.scalar_one_or_none()

async def list_admins(db: AsyncSession, skip: int = 0, limit: int = 100) -> tuple[list[MasterAdmin], int]:
    """List all master admins with pagination."""
    from sqlalchemy import func
    count_query = select(func.count(MasterAdmin.id))
    total = await db.scalar(count_query)
    
    query = select(MasterAdmin).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all()), total or 0

async def update_admin(db: AsyncSession, admin: MasterAdmin, update_data: dict, commit: bool = True) -> MasterAdmin:
    """Update a master admin."""
    for key, value in update_data.items():
        setattr(admin, key, value)
    if commit:
        await db.commit()
        await db.refresh(admin)
    return admin

async def toggle_admin_status(db: AsyncSession, admin_id: int, is_active: bool, commit: bool = True) -> MasterAdmin | None:
    """Enable or disable a master admin account."""
    admin = await get_admin_by_id(db, admin_id)
    if not admin:
        return None
    return await update_admin(db, admin, {"is_active": is_active}, commit=commit)
