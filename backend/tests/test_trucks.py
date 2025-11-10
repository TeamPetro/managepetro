import pytest

@pytest.mark.asyncio
async def test_create_and_get_truck(async_client):
    truck_payload = {
        "code": "T001",
        "plate": "ABC123",
        "capacity_liters": 10000,
        "fuel_level_percent": 80,
        "fuel_type": "diesel",
        "status": "active"  # ✅ changed from "available" to "active"
    }

    # Create truck
    res = await async_client.post("/api/trucks", json=truck_payload)
    assert res.status_code == 200, res.text
    created_truck = res.json()
    assert created_truck["code"] == "T001"

    # Fetch trucks
    res = await async_client.get("/api/trucks")
    assert res.status_code == 200
    trucks = res.json()
    assert any(t["code"] == "T001" for t in trucks)
