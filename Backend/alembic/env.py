import asyncio
import os
from logging.config import fileConfig

# --- IMPORTANT: Load environment variables for Alembic ---
from dotenv import load_dotenv
load_dotenv() # This line loads your .env file in the Backend/ directory


from sqlalchemy import pool, create_engine
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

from alembic import context
from app.models import session

# --- IMPORTANT: Import your Base and ALL your models here ---
# This is how Alembic discovers your database tables (e.g., User, Lead)
from app.db.base_class import Base
import app.models # <-- This imports all models via app/models/__init__.py


# --- Alembic Config Object ---
config = context.config

# --- Database URL Configuration ---
# Get DATABASE_URL directly from .env, which should already be 'postgresql+asyncpg://'
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in .env. Please set it.")

# Override sqlalchemy.url in alembic.ini from environment variable
config.set_main_option("sqlalchemy.url", DATABASE_URL)


# --- Logging Setup (if configured in alembic.ini) ---
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# --- Target Metadata for Schema Detection ---
# Alembic compares this against your live database to detect changes
target_metadata = Base.metadata


# --- Offline Mode (for generating migration files without a DB connection) ---
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode. """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# --- Online Mode (for applying migrations with a live DB connection) ---
def do_run_migrations(connection: AsyncConnection) -> None:
    """Configures and runs migrations with an active database connection."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Connects to the database asynchronously and runs migrations."""
    connectable = create_async_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,  # Use NullPool for migrations to avoid connection issues
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    
    await connectable.dispose() 

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


# --- Main Entry Point for Alembic ---
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()