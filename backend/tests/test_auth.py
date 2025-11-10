import pytest
import uuid

@pytest.mark.asyncio
async def test_register_and_login(async_client):
    # ✅ generate unique username each time
    unique_username = f"testuser_{uuid.uuid4().hex[:6]}"

    # Register new user
    register_payload = {
        "username": unique_username,
        "email": f"{unique_username}@example.com",
        "password": "password123"
    }

    res = await async_client.post("/auth/register", json=register_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["username"] == unique_username
    assert "id" in data

    # Login user
    login_payload = {"username": unique_username, "password": "password123"}
    res = await async_client.post("/auth/token", data=login_payload)
    assert res.status_code == 200, res.text
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
