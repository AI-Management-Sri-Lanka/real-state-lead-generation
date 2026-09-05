from unittest.mock import patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.db.base_class import Base
from app.models.user import User  # noqa: F401 ensures model is registered on Base
from app.services.auth.auth_service import authenticate_or_create_google_user
from app.services.auth.google_service import GoogleProfile
from app.core.errors import AppException
from app.crud.user_crud import get_user_by_email_db, get_user_by_google_id_db


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


def _profile(email="new.user@example.com", sub="google-sub-123", name="New User"):
    return GoogleProfile(google_id=sub, email=email, email_verified=True, full_name=name)


@pytest.mark.asyncio
async def test_google_login_creates_new_user(db_session):
    with patch(
        "app.services.auth.auth_service.verify_google_id_token",
        return_value=_profile(),
    ):
        user = await authenticate_or_create_google_user(db_session, "fake-token", commit=True)

    assert user.email == "new.user@example.com"
    assert user.google_id == "google-sub-123"
    assert user.auth_provider == "google"
    assert user.hashed_password is None


@pytest.mark.asyncio
async def test_google_login_is_idempotent_for_same_google_account(db_session):
    profile = _profile()
    with patch("app.services.auth.auth_service.verify_google_id_token", return_value=profile):
        first = await authenticate_or_create_google_user(db_session, "fake-token", commit=True)
        second = await authenticate_or_create_google_user(db_session, "fake-token", commit=True)

    assert first.id == second.id
    all_matches = await get_user_by_google_id_db(db_session, profile.google_id)
    assert all_matches is not None


@pytest.mark.asyncio
async def test_google_login_links_to_existing_local_account_by_email(db_session):
    from app.crud.user_crud import create_user_db

    existing = await create_user_db(
        db_session,
        {"full_name": "Local User", "email": "shared@example.com", "hashed_password": "hashed"},
        commit=True,
    )
    assert existing.google_id is None

    with patch(
        "app.services.auth.auth_service.verify_google_id_token",
        return_value=_profile(email="shared@example.com", sub="google-sub-999"),
    ):
        linked = await authenticate_or_create_google_user(db_session, "fake-token", commit=True)

    assert linked.id == existing.id
    assert linked.google_id == "google-sub-999"
    # Local password must be preserved -- linking Google shouldn't wipe it.
    assert linked.hashed_password == "hashed"


@pytest.mark.asyncio
async def test_google_login_rejects_disabled_account(db_session):
    from app.crud.user_crud import create_user_db

    disabled = await create_user_db(
        db_session,
        {"full_name": "Banned User", "email": "banned@example.com", "hashed_password": "hashed", "is_active": False},
        commit=True,
    )
    assert disabled.is_active is False

    with patch(
        "app.services.auth.auth_service.verify_google_id_token",
        return_value=_profile(email="banned@example.com", sub="google-sub-banned"),
    ):
        with pytest.raises(AppException):
            await authenticate_or_create_google_user(db_session, "fake-token", commit=True)