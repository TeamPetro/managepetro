"""
Initialize and seed the production database on Render.
Runs schema.sql and seed.sql if tables don't exist or are empty.
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import dotenv
import logging

dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL and ensure it uses asyncpg driver for async operations
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL environment variable is required")

# Convert Render/Supabase postgres:// or postgresql:// to postgresql+asyncpg:// for async SQLAlchemy
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://") and "asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

logger.info(f"Using database URL: {database_url.split('@')[0]}@[REDACTED]")

# Create engine directly - don't use db_manager
engine = create_async_engine(database_url, echo=True, pool_pre_ping=True)


async def check_tables_exist():
    """Check if the database has been initialized."""
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                """
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """
            )
        )
        row = result.fetchone()
        logger.info(f"Tables found: {row[0]}")
        return row[0] > 0


async def check_data_exists():
    """Check if the database has been seeded with data."""
    async with engine.connect() as conn:
        try:
            result = await conn.execute(text("SELECT COUNT(*) as count FROM users"))
            row = result.fetchone()
            logger.info(f"User records found: {row[0]}")
            return row[0] > 0
        except Exception as e:
            logger.info(f"No users table found: {e}")
            return False


async def run_sql_file(file_path: Path, description: str):
    """Execute a SQL file."""
    logger.info(f"🔄 Running {description}...")

    if not file_path.exists():
        logger.warning(f"⚠️ Warning: {file_path} not found. Skipping.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split by semicolons and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]

    async with engine.begin() as conn:
        for i, statement in enumerate(statements, 1):
            # Skip USE statements for PostgreSQL
            if statement.upper().startswith("USE "):
                logger.info(f"  ⊘ Skipping USE statement (PostgreSQL)")
                continue

            # Skip MySQL-specific ALTER TABLE AUTO_INCREMENT
            if (
                "AUTO_INCREMENT" in statement.upper()
                and "ALTER TABLE" in statement.upper()
            ):
                logger.info(f"  ⊘ Skipping AUTO_INCREMENT statement (PostgreSQL)")
                continue

            try:
                await conn.execute(text(statement))
                logger.info(f"  ✓ Executed statement {i}/{len(statements)}")
            except Exception as e:
                logger.warning(f"  ⚠️ Statement {i} failed: {str(e)[:200]}")

    logger.info(f"✅ {description} completed.")


async def init_db():
    """Initialize the production database with schema and seed data."""
    logger.info("=" * 60)
    logger.info("🚀 Starting production database initialization...")
    logger.info("=" * 60)

    try:
        # Check if tables exist
        tables_exist = await check_tables_exist()
        data_exists = await check_data_exists()

        logger.info(f"📋 Tables exist: {tables_exist}")
        logger.info(f"📋 Data exists: {data_exists}")

        # Get script paths
        backend_dir = Path(__file__).parent
        schema_file = backend_dir / "db" / "schema.sql"
        seed_file = backend_dir / "db" / "seed.sql"

        logger.info(f"📂 Schema file: {schema_file} (exists: {schema_file.exists()})")
        logger.info(f"📂 Seed file: {seed_file} (exists: {seed_file.exists()})")

        # Run schema if tables don't exist
        if not tables_exist:
            logger.info("\n🏗️ Tables not found. Running schema.sql...")
            await run_sql_file(schema_file, "schema.sql")
        else:
            logger.info("\n✓ Tables already exist. Skipping schema.sql")

        # Run seed if data doesn't exist
        if not data_exists:
            logger.info("\n🌱 No data found. Running seed.sql...")
            await run_sql_file(seed_file, "seed.sql")
        else:
            logger.info("\n✓ Data already exists. Skipping seed.sql")

        logger.info("\n" + "=" * 60)
        logger.info("✅ Production database initialization complete!")
        logger.info("=" * 60)

    except Exception as e:
        logger.error("\n" + "=" * 60)
        logger.error(f"❌ Database initialization failed: {e}")
        logger.error("=" * 60)
        raise
    finally:
        # Close the engine
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())
