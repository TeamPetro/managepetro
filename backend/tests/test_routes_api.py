import pytest

@pytest.mark.asyncio
async def test_route_api_returns_eta(async_client):
    payload = {
        "from": "Vancouver, BC",
        "to": "Burnaby, BC",
        "llm_model": "gpt-4"
    }
    res = await async_client.post("/api/eta", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "eta" in data
    assert "duration" in data["eta"]
