"""
Initialize and seed the production database on Render.
Runs schema.sql and seed.sql if tables don't exist or are empty.
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy import text
from database import db_manager


async def check_tables_exist():
    """Check if the database has been initialized."""
    async with db_manager.engine.connect() as conn:
        # PostgreSQL uses 'public' schema by default, MySQL uses DATABASE()
        result = await conn.execute(
            text(
                """
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' OR table_schema = DATABASE()
        """
            )
        )
        row = result.fetchone()
        return row[0] > 0


async def check_data_exists():
    """Check if the database has been seeded with data."""
    async with db_manager.engine.connect() as conn:
        try:
            result = await conn.execute(text("SELECT COUNT(*) as count FROM users"))
            row = result.fetchone()
            return row[0] > 0
        except Exception:
            return False


async def run_sql_file(file_path: Path, description: str):
    """Execute a SQL file."""
    print(f"🔄 Running {description}...")

    if not file_path.exists():
        print(f"⚠️ Warning: {file_path} not found. Skipping.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Split by semicolons and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]

    async with db_manager.engine.begin() as conn:
        for i, statement in enumerate(statements, 1):
            # Skip USE statements for PostgreSQL compatibility
            if statement.upper().startswith("USE "):
                continue

            # Skip MySQL-specific ALTER TABLE AUTO_INCREMENT for PostgreSQL
            if (
                "AUTO_INCREMENT" in statement.upper()
                and "ALTER TABLE" in statement.upper()
            ):
                continue

            try:
                await conn.execute(text(statement))
                print(f"  ✓ Executed statement {i}/{len(statements)}")
            except Exception as e:
                print(f"  ⚠️ Statement {i} failed (may be expected): {str(e)[:100]}")

    print(f"✅ {description} completed.")


async def init_db():
    """Initialize the production database with schema and seed data."""
    print("=" * 60)
    print("🚀 Starting production database initialization...")
    print("=" * 60)

    db_type = (
        os.getenv("DATABASE_URL", "").split(":")[0]
        if os.getenv("DATABASE_URL")
        else "unknown"
    )
    print(f"📊 Database type detected: {db_type}")

    try:
        # Check if tables exist
        tables_exist = await check_tables_exist()
        data_exists = await check_data_exists()

        print(f"📋 Tables exist: {tables_exist}")
        print(f"📋 Data exists: {data_exists}")

        # Get script paths
        backend_dir = Path(__file__).parent
        schema_file = backend_dir / "db" / "schema.sql"
        seed_file = backend_dir / "db" / "seed.sql"

        # Run schema if tables don't exist
        if not tables_exist:
            print("\n🏗️ Tables not found. Running schema.sql...")
            await run_sql_file(schema_file, "schema.sql")
        else:
            print("\n✓ Tables already exist. Skipping schema.sql")

        # Run seed if data doesn't exist
        if not data_exists:
            print("\n🌱 No data found. Running seed.sql...")
            await run_sql_file(seed_file, "seed.sql")
        else:
            print("\n✓ Data already exists. Skipping seed.sql")
            print("  (To re-seed, manually run seed.sql which clears existing data)")

        print("\n" + "=" * 60)
        print("✅ Production database initialization complete!")
        print("=" * 60)

    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ Database initialization failed: {e}")
        print("=" * 60)
        raise


if __name__ == "__main__":
    asyncio.run(init_db())
