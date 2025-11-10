import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from database import Base
from main import app, get_session  # ✅ make sure get_session is imported
from httpx import AsyncClient, ASGITransport

# ✅ Use in-memory SQLite for fast isolated testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="function")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        # Drop and recreate all tables each test
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture(scope="function")
async def test_session(test_engine):
    async_session = sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

@pytest.fixture(scope="function")
async def async_client(test_session):
    """Create a test client using the test DB session."""
    # ✅ Override the dependency so FastAPI routes use test_session
    async def override_get_session():
        yield test_session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    # ✅ Clean up override after each test
    app.dependency_overrides.clear()

@pytest.fixture(scope="session", autouse=True)
def close_event_loop():
    """Ensure the event loop is closed cleanly after tests."""
    yield
    loop = asyncio.get_event_loop()
    loop.close()
