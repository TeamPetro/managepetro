"""
Database utility functions to reduce code duplication.
Centralized logic for common database operations.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database_models import Station as StationORM, Truck as TruckORM
from typing import Optional, Union
from fastapi import HTTPException


def format_station_id(station_id: int) -> str:
    """Format station numeric ID to API format (station-001)"""
    return f"station-{station_id:03d}"


def format_truck_id(truck_id: int) -> str:
    """Format truck numeric ID to API format (truck-001)"""
    return f"truck-{truck_id:03d}"


def parse_station_id(station_id: str) -> Union[int, str]:
    """
    Parse station ID from various formats:
    - 'station-001' -> 1 (numeric)
    - '123' -> 123 (numeric)
    - 'STN-ABC' -> 'STN-ABC' (code)
    Returns numeric ID or code string
    """
    if station_id.startswith("station-"):
        try:
            return int(station_id.split("-")[1])
        except (IndexError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid station ID format")
    elif station_id.isdigit():
        return int(station_id)
    else:
        return station_id  # Treat as code


def parse_truck_id(truck_id: str) -> Union[int, str]:
    """
    Parse truck ID from various formats:
    - 'truck-001' -> 1 (numeric)
    - '123' -> 123 (numeric)
    - 'T01' -> 'T01' (code)
    Returns numeric ID or code string
    """
    if truck_id.startswith("truck-"):
        try:
            return int(truck_id.split("-")[1])
        except (IndexError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid truck ID format")
    elif truck_id.isdigit():
        return int(truck_id)
    else:
        return truck_id  # Treat as code


async def get_station_by_id_or_code(
    session: AsyncSession, station_id: str
) -> Optional[StationORM]:
    """
    Get station by ID or code with unified logic.
    Returns Station ORM object or None if not found.
    """
    parsed_id = parse_station_id(station_id)

    if isinstance(parsed_id, int):
        stmt = select(StationORM).where(StationORM.id == parsed_id)
    else:
        stmt = select(StationORM).where(StationORM.code == parsed_id)

    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_truck_by_id_or_code(
    session: AsyncSession, truck_id: str
) -> Optional[TruckORM]:
    """
    Get truck by ID or code with unified logic.
    Returns Truck ORM object or None if not found.
    """
    parsed_id = parse_truck_id(truck_id)

    if isinstance(parsed_id, int):
        stmt = select(TruckORM).where(TruckORM.id == parsed_id)
    else:
        stmt = select(TruckORM).where(TruckORM.code == parsed_id)

    result = await session.execute(stmt)
    return result.scalar_one_or_none()


def calculate_fuel_percentage(
    current_level: Optional[float], capacity: Optional[float]
) -> int:
    """
    Calculate fuel level percentage with safe division.
    Returns 0 if invalid inputs.
    """
    try:
        if capacity and capacity > 0 and current_level is not None:
            return int((current_level / capacity) * 100)
    except (TypeError, ZeroDivisionError):
        pass
    return 0
