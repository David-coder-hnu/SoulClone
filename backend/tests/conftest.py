import os

import pytest_asyncio

os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("REDIS_URL", "memory")

from httpx import AsyncClient, ASGITransport  # noqa: E402
from app.main import app  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.models.base import Base  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test, drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Close pooled connections so the next test (with a fresh event loop)
    # does not reuse connections bound to the old loop.
    await engine.dispose()


@pytest_asyncio.fixture
async def client():
    """Yield an async HTTP client for the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
