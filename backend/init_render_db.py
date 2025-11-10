import asyncio
from database import db_manager
from models.database_models import Base
from models.user import User  # or whatever your actual user model is
from utils.auth import hash_password  # if you have it

async def init_render_db():
    print("🔧 Connecting to Render PostgreSQL...")
    async with db_manager.engine.begin() as conn:
        print("🧱 Dropping old tables (if any)...")
        await conn.run_sync(Base.metadata.drop_all)
        print("🧩 Creating new tables...")
        await conn.run_sync(Base.metadata.create_all)

    # Optional seeding example
    print("🌱 Seeding initial data...")
    async with db_manager.get_session() as session:
        admin = User(
            username="admin",
            email="admin@managepetro.com",
            password=hash_password("admin123")
        )
        session.add(admin)
        await session.commit()
    print("✅ Render database initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_render_db())
