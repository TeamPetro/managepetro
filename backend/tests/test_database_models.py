import pytest
from models.database_models import Truck

@pytest.mark.asyncio
def test_truck_model_fields():
    truck = Truck(
        code="T002",
        plate="XYZ789",
        capacity_liters=12000,
        fuel_level_percent=50,
        fuel_type="gasoline",
        status="inactive"
    )
    assert truck.code == "T002"
    assert truck.plate == "XYZ789"
    assert truck.status == "inactive"
