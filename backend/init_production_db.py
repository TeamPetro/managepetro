"""
Initialize and seed the production database on Render.
Runs schema.sql and seed.sql if tables don't exist or are empty.
"""

import asyncio
import os
import sys
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import dotenv
import logging

dotenv.load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Get database URL and ensure it uses asyncpg driver for async operations
database_url = os.getenv("DATABASE_URL")
if not database_url:
    logger.error("❌ DATABASE_URL environment variable is not set!")
    logger.error("Please set DATABASE_URL in your Render dashboard environment variables.")
    sys.exit(1)

logger.info(f"✓ DATABASE_URL found: {database_url[:20]}...")

# Convert Render/Supabase postgres:// or postgresql:// to postgresql+asyncpg:// for async SQLAlchemy
original_url = database_url
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    logger.info("✓ Converted postgres:// to postgresql+asyncpg://")
elif database_url.startswith("postgresql://") and "asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    logger.info("✓ Converted postgresql:// to postgresql+asyncpg://")
elif "asyncpg" in database_url:
    logger.info("✓ Already using asyncpg driver")
else:
    logger.warning(f"⚠️ Unexpected DATABASE_URL format: {database_url[:20]}...")

# Create engine directly - don't use db_manager
logger.info("Creating database engine...")
try:
    engine = create_async_engine(
        database_url, 
        echo=False,  # Set to False to reduce log noise
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    logger.info("✓ Database engine created successfully")
except Exception as e:
    logger.error(f"❌ Failed to create database engine: {e}")
    sys.exit(1)


async def check_tables_exist():
    """Check if the database has been initialized."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text(
                    """
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """
                )
            )
            row = result.fetchone()
            count = row[0] if row else 0
            logger.info(f"📊 Tables found in database: {count}")
            return count > 0
    except Exception as e:
        logger.error(f"❌ Error checking for tables: {e}")
        raise


async def check_data_exists():
    """Check if the database has been seeded with data."""
    try:
        async with engine.connect() as conn:
            # Check multiple tables to ensure proper seeding
            checks = {
                'users': 0,
                'drivers': 0,
                'stations': 0,
                'trucks': 0
            }
            
            for table_name in checks.keys():
                try:
                    result = await conn.execute(text(f"SELECT COUNT(*) as count FROM {table_name}"))
                    row = result.fetchone()
                    checks[table_name] = row[0] if row else 0
                    logger.info(f"  {table_name}: {checks[table_name]} records")
                except Exception as table_error:
                    logger.warning(f"  {table_name}: table not accessible ({table_error})")
                    checks[table_name] = 0
            
            # Consider data exists if we have users or drivers
            has_data = checks['users'] > 0 or checks['drivers'] > 0
            logger.info(f"📊 Database has data: {has_data}")
            return has_data
    except Exception as e:
        logger.warning(f"⚠️ Error checking for data: {e}")
        return False


async def run_sql_file(file_path: Path, description: str):
    """Execute a SQL file."""
    logger.info(f"🔄 Running {description}...")

    if not file_path.exists():
        logger.error(f"❌ ERROR: {file_path} not found!")
        logger.error(f"   Expected path: {file_path.absolute()}")
        raise FileNotFoundError(f"Required file not found: {file_path}")

    logger.info(f"✓ Found file: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    logger.info(f"✓ File size: {len(sql_content)} bytes")

    # Split by semicolons and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]
    logger.info(f"✓ Found {len(statements)} SQL statements to execute")

    successful = 0
    skipped = 0
    failed = 0

    async with engine.begin() as conn:
        for i, statement in enumerate(statements, 1):
            # Skip USE statements for PostgreSQL
            if statement.upper().startswith("USE "):
                logger.info(f"  ⊘ Skipping USE statement (PostgreSQL)")
                skipped += 1
                continue

            # Skip MySQL-specific ALTER TABLE AUTO_INCREMENT
            if (
                "AUTO_INCREMENT" in statement.upper()
                and "ALTER TABLE" in statement.upper()
            ):
                logger.info(f"  ⊘ Skipping AUTO_INCREMENT statement (PostgreSQL)")
                skipped += 1
                continue

            try:
                await conn.execute(text(statement))
                successful += 1
                if i % 10 == 0:  # Log progress every 10 statements
                    logger.info(f"  ✓ Progress: {i}/{len(statements)} statements processed")
            except Exception as e:
                failed += 1
                error_msg = str(e)[:200]
                # Only log as warning if it's a "relation already exists" error (expected on re-runs)
                if "already exists" in error_msg.lower():
                    logger.debug(f"  ⊘ Statement {i}: {error_msg}")
                else:
                    logger.warning(f"  ⚠️ Statement {i} failed: {error_msg}")

    logger.info(f"✅ {description} completed: {successful} successful, {skipped} skipped, {failed} failed")


async def init_db():
    """Initialize the production database with schema and seed data."""
    logger.info("=" * 80)
    logger.info("🚀 MANAGEPETRO DATABASE INITIALIZATION - STARTING")
    logger.info("=" * 80)
    
    start_time = asyncio.get_event_loop().time()

    try:
        # Test database connection first
        logger.info("\n📡 Testing database connection...")
        try:
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                logger.info("✅ Database connection successful!")
        except Exception as conn_error:
            logger.error(f"❌ Database connection failed: {conn_error}")
            logger.error("Please verify your DATABASE_URL is correct and the database is accessible.")
            raise

        # Check if tables exist
        logger.info("\n📋 Checking existing database state...")
        tables_exist = await check_tables_exist()
        data_exists = await check_data_exists()

        # Get script paths
        backend_dir = Path(__file__).parent
        schema_file = backend_dir / "db" / "schema.sql"
        seed_file = backend_dir / "db" / "seed.sql"

        logger.info(f"\n📂 File locations:")
        logger.info(f"   Backend directory: {backend_dir.absolute()}")
        logger.info(f"   Schema file: {schema_file.absolute()} (exists: {schema_file.exists()})")
        logger.info(f"   Seed file: {seed_file.absolute()} (exists: {seed_file.exists()})")

        # Run schema if tables don't exist
        if not tables_exist:
            logger.info("\n" + "=" * 80)
            logger.info("🏗️  CREATING DATABASE SCHEMA")
            logger.info("=" * 80)
            await run_sql_file(schema_file, "schema.sql")
            logger.info("✅ Schema creation completed")
            
            # Re-check tables after schema creation
            tables_exist = await check_tables_exist()
            if not tables_exist:
                logger.error("❌ Schema creation failed - no tables found after running schema.sql")
                raise RuntimeError("Schema creation failed")
        else:
            logger.info("\n✓ Tables already exist in database. Skipping schema creation.")

        # Run seed if data doesn't exist
        if not data_exists:
            logger.info("\n" + "=" * 80)
            logger.info("🌱 SEEDING DATABASE WITH INITIAL DATA")
            logger.info("=" * 80)
            await run_sql_file(seed_file, "seed.sql")
            logger.info("✅ Database seeding completed")
            
            # Verify seeding was successful
            logger.info("\n📊 Verifying seeded data...")
            data_exists_after = await check_data_exists()
            if not data_exists_after:
                logger.warning("⚠️ Warning: No data found after running seed.sql")
                logger.warning("   This may indicate an issue with the seed file or data insertion")
            else:
                logger.info("✅ Data verification successful - database properly seeded")
        else:
            logger.info("\n✓ Data already exists in database. Skipping seeding.")

        elapsed = asyncio.get_event_loop().time() - start_time
        logger.info("\n" + "=" * 80)
        logger.info(f"✅ DATABASE INITIALIZATION COMPLETE (took {elapsed:.2f}s)")
        logger.info("=" * 80)
        logger.info("")

    except Exception as e:
        elapsed = asyncio.get_event_loop().time() - start_time
        logger.error("\n" + "=" * 80)
        logger.error(f"❌ DATABASE INITIALIZATION FAILED (after {elapsed:.2f}s)")
        logger.error("=" * 80)
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error("")
        logger.error("Common issues and solutions:")
        logger.error("  1. DATABASE_URL not set → Check Render environment variables")
        logger.error("  2. Connection timeout → Check database is running and accessible")
        logger.error("  3. Permission denied → Verify database credentials")
        logger.error("  4. SQL syntax error → Check schema.sql and seed.sql files")
        logger.error("=" * 80)
        raise
    finally:
        # Close the engine
        logger.info("🔒 Closing database connections...")
        await engine.dispose()
        logger.info("✓ Database connections closed")


if __name__ == "__main__":
    asyncio.run(init_db())
