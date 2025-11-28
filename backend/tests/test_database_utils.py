import pytest
from utils.database_utils import calculate_fuel_percentage

@pytest.mark.parametrize("current,capacity,expected", [
    (50, 100, 50),
    (0, 100, 0),
    (None, 100, 0),
    (100, 0, 0),
    (100, None, 0),
])
def test_calculate_fuel_percentage(current, capacity, expected):
    assert calculate_fuel_percentage(current, capacity) == expected
