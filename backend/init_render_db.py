"""
Initialize the database on Render deployment safely.
Skips creation if tables already exist.
"""

import asyncio
from sqlalchemy.exc import ProgrammingError
from database import db_manager
from models.database_models import Base

async def init_db():
    print("🔄 Initializing database (safe mode)...")
    try:
        async with db_manager.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables are ready.")
    except ProgrammingError as e:
        print(f"⚠️ Skipped existing tables: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
