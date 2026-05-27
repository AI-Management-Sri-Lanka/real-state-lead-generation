from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator
from app.core.config import settings

# 1. Create the Async Engine (The connection pool)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

# 2. Create the Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

# 3. FastAPI Dependency Injection 
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        # 'async with' automatically closes the connection here