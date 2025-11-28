import pytest
from services.prompt_service import PromptService

@pytest.mark.asyncio
def test_format_dispatch_prompt():
    ps = PromptService()
    class DummyTruck:
        compartments = []
        code = "T001"
        plate = "ABC123"
        capacity_liters = 10000
        fuel_level_percent = 80
        truck_fuel_level_percent = 80
        fuel_type = "diesel"
        status = "active"
        fuel_consumption_rate = 30
        efficiency_rating = 0.85
        max_range_km = 500.0
    class DummyWeather:
        condition = "Clear"
        temp_c = 20
        wind_kph = 10
    truck = DummyTruck()
    depot_weather = DummyWeather()
    prompt = ps.format_dispatch_prompt(truck=truck, stations=[], depot_location="Test Depot", depot_weather=depot_weather)
    assert isinstance(prompt, str)
    assert len(prompt) > 0
