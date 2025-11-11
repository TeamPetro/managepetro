"""
Initialize the database on Render deployment.

This script ensures all tables are created using SQLAlchemy models.
Run automatically by Render as part of your start command.
"""

import asyncio
from database import db_manager
from models.database_models import Base  # your SQLAlchemy Base

async def init_db():
    print("🔄 Initializing database...")
    async with db_manager.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
