from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schemas.user_schema import UserCreate

# Password hashing context using argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain text password using argon2."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


async def create_user(db: AsyncSession, user: UserCreate) -> User:
    """Create a new user in the database."""
    hashed_password = hash_password(user.password)
    
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password
    )
    
    try:
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        await db.rollback()
        if "email" in str(e):
            raise ValueError("Email already registered")
        raise


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Retrieve a user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticate a user by email and password."""
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
