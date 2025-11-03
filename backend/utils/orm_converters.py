"""
ORM to Data Model converters.
Centralizes the logic for converting SQLAlchemy ORM objects to Pydantic/dataclass models.
"""

from typing import List
from models.database_models import (
    Station as StationORM,
    Truck as TruckORM,
    TruckCompartment as CompartmentORM,
)
from models.data_models import StationData, TruckData


def convert_compartment_to_dict(compartment: CompartmentORM) -> dict:
    """
    Convert a TruckCompartment ORM object to a dictionary.
    Used when converting truck compartments.
    """
    return {
        "compartment_number": compartment.compartment_number,
        "fuel_type": compartment.fuel_type,
        "capacity_liters": float(compartment.capacity_liters),
        "current_level_liters": float(compartment.current_level_liters),
    }


def convert_station_orm_to_data(
    station: StationORM, safe_float: bool = False
) -> StationData:
    """
    Convert a Station ORM object to StationData.

    Args:
        station: SQLAlchemy Station ORM object
        safe_float: If True, safely convert numeric fields to float (handles None)

    Returns:
        StationData object
    """
    if safe_float:
        return StationData(
            id=station.id,
            code=station.code,
            name=station.name,
            lat=float(station.lat) if station.lat else None,
            lon=float(station.lon) if station.lon else None,
            city=station.city,
            region=station.region,
            fuel_type=station.fuel_type,
            capacity_liters=(
                float(station.capacity_liters) if station.capacity_liters else None
            ),
            current_level_liters=(
                float(station.current_level_liters)
                if station.current_level_liters
                else None
            ),
            request_method=station.request_method,
            low_fuel_threshold=(
                float(station.low_fuel_threshold)
                if station.low_fuel_threshold
                else None
            ),
        )
    else:
        return StationData(
            id=station.id,
            code=station.code,
            name=station.name,
            lat=station.lat,
            lon=station.lon,
            city=station.city,
            region=station.region,
            fuel_type=station.fuel_type,
            capacity_liters=station.capacity_liters,
            current_level_liters=station.current_level_liters,
            request_method=station.request_method,
            low_fuel_threshold=station.low_fuel_threshold,
        )


def convert_truck_orm_to_data(
    truck: TruckORM, compartments: List[CompartmentORM] = None
) -> TruckData:
    """
    Convert a Truck ORM object to TruckData.

    Args:
        truck: SQLAlchemy Truck ORM object
        compartments: Optional list of compartment ORM objects (if already loaded)

    Returns:
        TruckData object
    """
    # Convert compartments if provided
    compartment_dicts = []
    if compartments:
        compartment_dicts = [convert_compartment_to_dict(comp) for comp in compartments]
    elif hasattr(truck, "compartments") and truck.compartments:
        compartment_dicts = [
            convert_compartment_to_dict(comp) for comp in truck.compartments
        ]

    return TruckData(
        id=truck.id,
        code=truck.code,
        plate=truck.plate,
        capacity_liters=(
            float(truck.capacity_liters) if truck.capacity_liters else None
        ),
        fuel_level_percent=truck.fuel_level_percent,
        fuel_type=truck.fuel_type,
        status=truck.status,
        compartments=compartment_dicts,
    )


def convert_stations_list(
    stations_orm: List[StationORM], safe_float: bool = False
) -> List[StationData]:
    """
    Convert a list of Station ORM objects to StationData list.

    Args:
        stations_orm: List of SQLAlchemy Station ORM objects
        safe_float: If True, safely convert numeric fields to float

    Returns:
        List of StationData objects
    """
    return [
        convert_station_orm_to_data(station, safe_float=safe_float)
        for station in stations_orm
    ]


def convert_trucks_list(
    trucks_orm: List[TruckORM], load_compartments: bool = True
) -> List[TruckData]:
    """
    Convert a list of Truck ORM objects to TruckData list.

    Args:
        trucks_orm: List of SQLAlchemy Truck ORM objects
        load_compartments: Whether to include compartments in conversion

    Returns:
        List of TruckData objects
    """
    return [convert_truck_orm_to_data(truck) for truck in trucks_orm]
