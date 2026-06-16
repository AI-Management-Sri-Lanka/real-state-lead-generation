import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load env file
backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/real_estate_dev_db"
else:
    # Convert async driver connection to sync if necessary
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# Ensure backend directory is in sys.path
sys.path.insert(0, str(backend_dir))

# Import Base and models
from app.db.base_class import Base
from app.models.properties import Property, PropertyImage, PropertyType, ListingType, Furnishing

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Connected to PostgreSQL successfully.")
    except Exception as e:
        print(f"Could not connect to PostgreSQL: {e}")
        print("Make sure your container is running: docker compose up -d")
        sys.exit(1)

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully: properties, property_images")

def seed_data():
    # Load properties.json from frontend
    json_path = backend_dir.parent / "Frontend" / "src" / "data" / "properties.json"
    if not json_path.exists():
        print(f"Could not find properties.json at {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        properties_data = json.load(f)

    db = SessionLocal()
    try:
        existing = db.query(Property).count()
        if existing > 0:
            print(f"Skipping seed -- {existing} properties already exist.")
            return

        print(f"Seeding {len(properties_data)} properties from properties.json...")
        for p in properties_data:
            # Map ID
            raw_id = p.get("id")
            db_id = None
            if raw_id and raw_id.startswith("prop-"):
                try:
                    db_id = int(raw_id.replace("prop-", ""))
                except ValueError:
                    pass

            # Map property type
            prop_type_val = p.get("type")
            try:
                # Find matching enum value
                prop_type = next(pt for pt in PropertyType if pt.value == prop_type_val)
            except StopIteration:
                prop_type = PropertyType.apartment

            # Map listing type
            listing_type_val = p.get("listingType")
            if listing_type_val == "Sale":
                listing_type = ListingType.sale
            elif listing_type_val == "Rent":
                listing_type = ListingType.rent
            else:
                listing_type = ListingType.sale

            # Map furnishing status
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

            # Add images if any
            for idx, img_url in enumerate(p.get("images", [])):
                prop.images.append(
                    PropertyImage(
                        url=img_url,
                        is_primary=(idx == 0),
                        sort_order=idx
                    )
                )

            db.add(prop)

        db.commit()
        print(f"Inserted {len(properties_data)} sample properties from properties.json.")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()

def reset():
    """Drop and recreate all tables, then re-seed."""
    print("Dropping tables...")
    try:
        # Drop dependent tables first
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS property_images CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS properties CASCADE"))
            conn.commit()
        print("Tables dropped successfully.")
    except Exception as e:
        print(f"Error dropping tables: {e}")
    create_tables()
    seed_data()

if __name__ == "__main__":
    check_connection()

    if "--reset" in sys.argv:
        reset()
    else:
        create_tables()
        seed_data()