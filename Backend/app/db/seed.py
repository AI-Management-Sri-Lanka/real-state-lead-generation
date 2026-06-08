import asyncio
import sys
from app.db.session import AsyncSessionLocal, engine
from app.db.base_class import Base
from app.models.user import User
from app.models.session import Session
from app.models.message import Message
from app.services.auth.auth_service import hash_password

async def seed_data():
    print("Connecting to the database and verifying tables...")

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables verified.")

    async with AsyncSessionLocal() as db:
        print("Starting seeding process...")

        # Dummy users
        print("Creating dummy users...")
        hashed_pw = hash_password("Password123")

        user_alice = User(
            full_name="Alice Smith",
            email="alice@example.com",
            hashed_password=hashed_pw,
            is_active=True
        )
        user_bob = User(
            full_name="Bob Jones",
            email="bob@example.com",
            hashed_password=hashed_pw,
            is_active=True
        )
        user_charlie = User(
            full_name="Charlie Brown",
            email="charlie@example.com",
            hashed_password=hashed_pw,
            is_active=True
        )

        db.add_all([user_alice, user_bob, user_charlie])
        await db.flush()  # Populate IDs

        # Dummy sessions
        print("Creating dummy sessions...")
        session_colombo = Session(
            user_id=user_alice.id,
            title="Colombo House Hunting"
        )
        session_kandy = Session(
            user_id=user_alice.id,
            title="Kandy Property Rental"
        )
        session_galle = Session(
            user_id=user_bob.id,
            title="Commercial Land in Galle"
        )

        db.add_all([session_colombo, session_kandy, session_galle])
        await db.flush()

        # Dummy messages
        print("Creating dummy messages...")
        messages = [
            Message(
                session_id=session_colombo.id,
                role="user",
                content="Hi, I am looking for a 3-bedroom house in Colombo."
            ),
            Message(
                session_id=session_colombo.id,
                role="assistant",
                content="Hello Alice! I can help with that. Are you looking to buy or rent, and what is your budget?"
            ),
            Message(
                session_id=session_colombo.id,
                role="user",
                content="I want to buy, budget is around 40 million LKR."
            ),
            Message(
                session_id=session_colombo.id,
                role="assistant",
                content="Great. I will search for properties matching those criteria."
            ),


            Message(
                session_id=session_kandy.id,
                role="user",
                content="Any rental apartments near Kandy town?"
            ),
            Message(
                session_id=session_kandy.id,
                role="assistant",
                content="Yes, there are several apartments available. What is your budget per month?"
            ),


            Message(
                session_id=session_galle.id,
                role="user",
                content="Show me commercial land plots in Galle."
            ),
            Message(
                session_id=session_galle.id,
                role="assistant",
                content="Sure, here are a few options in Galle..."
            )
        ]

        db.add_all(messages)
        await db.commit()
        print("Database seeded successfully with users, sessions and messages!")

if __name__ == "__main__":
    try:
        asyncio.run(seed_data())
    except Exception as e:
        print(f"Error seeding database: {e}", file=sys.stderr)
        sys.exit(1)