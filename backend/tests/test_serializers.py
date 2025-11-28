import pytest
from utils.serializers import truck_api_dict

def test_truck_api_dict():
    class DummyTruck:
        id = 1
        code = "T001"
        plate = "ABC123"
        capacity_liters = 10000
        fuel_level_percent = 80
        fuel_type = "diesel"
        status = "active"
        compartments = []
    truck = DummyTruck()
    result = truck_api_dict(truck)
    assert result["code"] == "T001"
    assert result["status"] == "active"
