import asyncio
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# Load env file
backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:12345678@localhost:5432/real_estate_dev_db"
else:
    # Ensure async driver
    if "postgresql://" in DATABASE_URL and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Ensure backend directory is in sys.path
sys.path.insert(0, str(backend_dir))

# Import Base and models
from app.db.base_class import Base
from app.db.session import AsyncSessionLocal, engine
from app.models.properties import Property, PropertyImage, PropertyType, ListingType, Furnishing
from app.models.user import User
from app.models.session import Session
from app.models.message import Message
from app.services.auth.auth_service import hash_password


async def check_connection():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("Connected to PostgreSQL successfully.")
    except Exception as e:
        print(f"Could not connect to PostgreSQL: {e}")
        print("Make sure your container is running: docker compose up -d")
        sys.exit(1)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")


async def seed_properties(db: AsyncSession):
    json_path = backend_dir.parent / "Frontend" / "src" / "data" / "properties.json"
    if not json_path.exists():
        print(f"Could not find properties.json at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        properties_data = json.load(f)

    result = await db.execute(text("SELECT COUNT(*) FROM properties"))
    existing = result.scalar()
    if existing > 0:
        print(f"Skipping property seed -- {existing} properties already exist.")
        return

    print(f"Seeding {len(properties_data)} properties from properties.json...")
    for p in properties_data:
        raw_id = p.get("id")
        db_id = None
        if raw_id and raw_id.startswith("prop-"):
            try:
                db_id = int(raw_id.replace("prop-", ""))
            except ValueError:
                pass

        prop_type_val = p.get("type")
        try:
            prop_type = next(pt for pt in PropertyType if pt.value == prop_type_val)
        except StopIteration:
            prop_type = PropertyType.apartment

        listing_type_val = p.get("listingType")
        if listing_type_val == "Sale":
            listing_type = ListingType.sale
        elif listing_type_val == "Rent":
            listing_type = ListingType.rent
        else:
            listing_type = ListingType.sale

        furnishing_val = p.get("furnishing")
        furnishing = None
        if furnishing_val:
            f_lower = furnishing_val.lower().replace("-", " ")
            if "semi" in f_lower:
                furnishing = Furnishing.semi_furnished
            elif "fully" in f_lower or f_lower == "furnished":
                furnishing = Furnishing.fully_furnished
            elif "unfurnished" in f_lower:
                furnishing = Furnishing.unfurnished

        prop = Property(
            id=db_id,
            title=p.get("title"),
            price=float(p.get("price")),
            currency=p.get("currency", "LKR"),
            location=p.get("location"),
            bedrooms=p.get("bedrooms"),
            bathrooms=p.get("bathrooms"),
            area_sqft=p.get("areaSqft"),
            land_size_perches=p.get("landSizePerches"),
            property_type=prop_type,
            listing_type=listing_type,
            is_verified=p.get("verified", False),
            furnishing=furnishing,
            parking=p.get("parking"),
            listed_by=p.get("listedBy"),
            description=p.get("description")
        )

        for idx, img_url in enumerate(p.get("images", [])):
            prop.images.append(
                PropertyImage(
                    url=img_url,
                    is_primary=(idx == 0),
                    sort_order=idx
                )
            )

        db.add(prop)

    print(f"Queued {len(properties_data)} properties for insert.")


async def seed_users(db: AsyncSession):
    print("Creating dummy users...")
    hashed_pw = hash_password("Password123")

    user_alice = User(full_name="Alice Smith", email="alice@example.com", hashed_password=hashed_pw, is_active=True)
    user_bob = User(full_name="Bob Jones", email="bob@example.com", hashed_password=hashed_pw, is_active=True)
    user_charlie = User(full_name="Charlie Brown", email="charlie@example.com", hashed_password=hashed_pw, is_active=True)

    db.add_all([user_alice, user_bob, user_charlie])
    await db.flush()

    print("Creating dummy sessions...")
    session_colombo = Session(user_id=user_alice.id, title="Colombo House Hunting")
    session_kandy = Session(user_id=user_alice.id, title="Kandy Property Rental")
    session_galle = Session(user_id=user_bob.id, title="Commercial Land in Galle")

    db.add_all([session_colombo, session_kandy, session_galle])
    await db.flush()

    print("Creating dummy messages...")
    messages = [
        Message(session_id=session_colombo.id, role="user", content="Hi, I am looking for a 3-bedroom house in Colombo."),
        Message(session_id=session_colombo.id, role="assistant", content="Hello Alice! I can help with that. Are you looking to buy or rent, and what is your budget?"),
        Message(session_id=session_colombo.id, role="user", content="I want to buy, budget is around 40 million LKR."),
        Message(session_id=session_colombo.id, role="assistant", content="Great. I will search for properties matching those criteria."),
        Message(session_id=session_kandy.id, role="user", content="Any rental apartments near Kandy town?"),
        Message(session_id=session_kandy.id, role="assistant", content="Yes, there are several apartments available. What is your budget per month?"),
        Message(session_id=session_galle.id, role="user", content="Show me commercial land plots in Galle."),
        Message(session_id=session_galle.id, role="assistant", content="Sure, here are a few options in Galle..."),
    ]
    db.add_all(messages)
    print("Dummy users, sessions, and messages queued.")


async def seed_data():
    print("Connecting to the database and verifying tables...")
    await create_tables()

    async with AsyncSessionLocal() as db:
        print("Starting seeding process...")
        try:
            await seed_properties(db)
            await seed_users(db)
            await db.commit()
            print("Database seeded successfully with properties, users, sessions, and messages!")
        except Exception as e:
            await db.rollback()
            print(f"Seed failed: {e}")
            raise


async def reset():
    """Drop and recreate all tables, then re-seed."""
    print("Dropping tables...")
    async with engine.connect() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS property_images CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS properties CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS messages CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS sessions CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        await conn.commit()
    print("Tables dropped successfully.")
    await seed_data()


if __name__ == "__main__":
    async def main():
        await check_connection()
        if "--reset" in sys.argv:
            await reset()
        else:
            await seed_data()

    try:
        asyncio.run(main())
    except Exception as e:
        print(f"Error seeding database: {e}", file=sys.stderr)
        sys.exit(1)