"""
SQLAlchemy 2.0 database configuration and session management.

This module provides async database connectivity using SQLAlchemy 2.0
with proper connection pooling and session management for FastAPI.
""" 

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from models.database_models import Base
from config import config


class DatabaseManager:
    """Manages SQLAlchemy async database connections and sessions."""

import os

class DatabaseManager:
    """Manages SQLAlchemy async database connections and sessions."""

    def __init__(self):
        # Check if a DATABASE_URL env var is defined (Render)
        database_url = os.getenv("DATABASE_URL")

        if database_url:
            # Use Render's managed Postgres database
            # Render URLs look like: postgres://user:pass@host:5432/dbname
            # SQLAlchemy async driver for Postgres uses "postgresql+asyncpg://"
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        else:
            # Fallback to local MySQL (your dev setup)
            database_url = (
                f"mysql+aiomysql://{config.DB_USER}:{config.DB_PASS}"
                f"@{config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}"
            )

        # SQLAlchemy 2.0 async engine configuration
        self.engine: AsyncEngine = create_async_engine(
            database_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False,
        )

        # Session factory
        self.async_session_maker = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True,
        )


    def get_session(self):
        """
        Get a new database session.

        Returns:
            AsyncSession context manager

        Example:
            async with db_manager.get_session() as session:
                result = await session.execute(select(User))
        """
        return self.async_session_maker()

    async def create_tables(self):
        """Create all database tables. Use only in development/testing."""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def drop_tables(self):
        """Drop all database tables. Use only in development/testing."""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    async def close(self):
        """Close the database engine and all connections."""
        await self.engine.dispose()


# Global database manager instance
db_manager = DatabaseManager()


# FastAPI dependency for getting database sessions
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for injecting database sessions.

    Usage in FastAPI endpoints:
        @app.get("/users")
        async def get_users(session: AsyncSession = Depends(get_db_session)):
            stmt = select(User)
            result = await session.execute(stmt)
            return result.scalars().all()
    """
    async with db_manager.get_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
