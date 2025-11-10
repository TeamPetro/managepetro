import pytest

@pytest.mark.asyncio
async def test_register_and_login(async_client):
    # Register new user
    register_payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    res = await async_client.post("/auth/register", json=register_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["username"] == "testuser"
    assert "id" in data

    # Login user
    login_payload = {"username": "testuser", "password": "password123"}
    res = await async_client.post("/auth/token", data=login_payload)
    assert res.status_code == 200, res.text
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
