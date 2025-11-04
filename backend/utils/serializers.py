from typing import Any, Dict
from constants import (
    DEFAULT_COUNTRY,
    REQUEST_METHOD_MANUAL,
    DEFAULT_LOW_FUEL_THRESHOLD,
    DELIVERY_STATUS_ENROUTE,
)
from utils.database_utils import (
    format_station_id,
    format_truck_id,
    calculate_fuel_percentage,
)


def station_api_dict(station: Any) -> Dict[str, Any]:
    """Serialize a Station ORM or data model object into the API station shape.

    This function is defensive and tolerates None values returned from the DB.
    """
    capacity = getattr(station, "capacity_liters", None) or 0
    current = getattr(station, "current_level_liters", None) or 0

    return {
        "station_id": format_station_id(getattr(station, "id", 0)),
        "name": getattr(station, "name", None),
        "city": getattr(station, "city", None),
        "region": getattr(station, "region", None),
        "country": DEFAULT_COUNTRY,
        "fuel_type": getattr(station, "fuel_type", None),
        "capacity_liters": capacity,
        "current_level_liters": current,
        "fuel_level": calculate_fuel_percentage(current, capacity),
        "code": getattr(station, "code", None),
        "lat": (
            float(getattr(station, "lat", 0))
            if getattr(station, "lat", None) is not None
            else None
        ),
        "lon": (
            float(getattr(station, "lon", 0))
            if getattr(station, "lon", None) is not None
            else None
        ),
        "request_method": getattr(station, "request_method", None)
        or REQUEST_METHOD_MANUAL,
        "low_fuel_threshold": getattr(station, "low_fuel_threshold", None)
        or DEFAULT_LOW_FUEL_THRESHOLD,
        "needs_refuel": bool(
            getattr(station, "needs_refuel", False)
            or (
                capacity
                and current
                and current
                < (
                    getattr(station, "low_fuel_threshold", DEFAULT_LOW_FUEL_THRESHOLD)
                    or DEFAULT_LOW_FUEL_THRESHOLD
                )
            )
        ),
    }


def station_available_dict(station: Any) -> Dict[str, Any]:
    """A slightly different station shape used in dispatch responses."""
    return {
        "station_id": format_station_id(getattr(station, "id", 0)),
        "name": getattr(station, "name", None),
        "city": getattr(station, "city", None),
        "region": getattr(station, "region", None),
        "fuel_type": getattr(station, "fuel_type", None),
        "current_level": getattr(station, "current_level_liters", None),
        "capacity": getattr(station, "capacity_liters", None),
        "fuel_level_percent": calculate_fuel_percentage(
            getattr(station, "current_level_liters", None),
            getattr(station, "capacity_liters", None),
        ),
        "request_method": getattr(station, "request_method", None),
        "needs_refuel": getattr(station, "needs_refuel", False),
        "lat": (
            float(getattr(station, "lat", 0))
            if getattr(station, "lat", None) is not None
            else None
        ),
        "lon": (
            float(getattr(station, "lon", 0))
            if getattr(station, "lon", None) is not None
            else None
        ),
    }


def truck_api_dict(truck: Any) -> Dict[str, Any]:
    """Serialize a Truck ORM or data model object into the API truck shape."""
    # Get driver information - handle both ORM objects and TruckData objects
    driver_name = None
    driver_status = None
    driver_hours_remaining = None

    # Check if it's a TruckData object (has driver_name attribute)
    if hasattr(truck, "driver_name") and getattr(truck, "driver_name", None):
        driver_name = truck.driver_name
        driver_status = getattr(truck, "driver_status", None)
        driver_hours_remaining = getattr(truck, "driver_hours_remaining", None)
    # Check if it's an ORM object with current_driver relationship
    elif hasattr(truck, "current_driver") and truck.current_driver:
        driver_name = (
            f"{truck.current_driver.first_name} {truck.current_driver.last_name}"
        )
        driver_status = truck.current_driver.status

        # Calculate hours remaining (simplified - would need full logic)
        if hasattr(truck.current_driver, "max_hours_per_shift"):
            driver_hours_remaining = float(
                truck.current_driver.max_hours_per_shift or 11.0
            )

    # Check for active deliveries - handle both TruckData objects and ORM objects
    has_active_deliveries = False
    if (
        hasattr(truck, "has_active_deliveries")
        and truck.has_active_deliveries is not None
    ):
        # TruckData object has pre-calculated has_active_deliveries
        has_active_deliveries = truck.has_active_deliveries
    elif hasattr(truck, "deliveries") and truck.deliveries:
        # ORM object with deliveries relationship loaded
        active_statuses = [DELIVERY_STATUS_ENROUTE]
        has_active_deliveries = any(
            d.status in active_statuses for d in truck.deliveries
        )

    return {
        "truck_id": format_truck_id(getattr(truck, "id", 0)),
        "plate_number": getattr(truck, "plate", None),
        "capacity_liters": getattr(truck, "capacity_liters", None),
        "fuel_level_percent": getattr(truck, "fuel_level_percent", None),
        "fuel_type": getattr(truck, "fuel_type", None),
        "status": getattr(truck, "status", None),
        "code": getattr(truck, "code", None),
        "compartments": getattr(truck, "compartments", None) or [],
        "driver_name": driver_name,
        "driver_status": driver_status,
        "driver_hours_remaining": driver_hours_remaining,
        "has_active_deliveries": has_active_deliveries,
    }


def truck_simple_dict(truck: Any) -> Dict[str, Any]:
    return {
        "truck_id": format_truck_id(getattr(truck, "id", 0)),
        "code": getattr(truck, "code", None),
        "plate": getattr(truck, "plate", None),
        "status": getattr(truck, "status", None),
        "compartments": getattr(truck, "compartments", None) or [],
        "current_driver_id": getattr(truck, "current_driver_id", None),
        "driver_name": getattr(truck, "driver_name", None),
    }


def trip_dict_from_row(r: Any) -> Dict[str, Any]:
    return {
        "trip_id": r.id,
        "volume_liters": r.volume_liters,
        "date": str(r.delivery_date),
        "status": r.status,
        "station": f"{r.station_name} ({r.station_code})",
        "city": r.city,
        "region": r.region,
        "lat": float(r.lat) if r.lat is not None else None,
        "lon": float(r.lon) if r.lon is not None else None,
    }


def trip_detail_from_row(r: Any) -> Dict[str, Any]:
    d = trip_dict_from_row(r)
    d["truck"] = f"{r.truck_code} ({r.truck_plate})"
    return d


def user_api_dict(user: Any) -> Dict[str, Any]:
    """Serialize a user object (ORM or Pydantic) into a safe API shape."""
    return {
        "id": getattr(user, "id", None),
        "username": getattr(user, "username", None),
        "email": getattr(user, "email", None),
        "is_active": getattr(user, "is_active", False),
        "created_at": getattr(user, "created_at", None),
    }


def weather_api_dict(weather: Any) -> Dict[str, Any]:
    """Normalize WeatherData or dict into a consistent API payload."""
    # If the object provides a to_dict helper, prefer it
    if hasattr(weather, "to_dict") and callable(getattr(weather, "to_dict")):
        try:
            return getattr(weather, "to_dict")() or {}
        except Exception:
            pass

    # If it's already a dict-like object
    if isinstance(weather, dict):
        return weather

    # Fallback: attempt to read common attributes defensively
    return {
        "city": getattr(weather, "city", None),
        "temperature_c": getattr(weather, "temperature_c", None)
        or getattr(weather, "temp_c", None),
        "condition": getattr(weather, "condition", None),
        "humidity": getattr(weather, "humidity", None),
        "wind_speed": getattr(weather, "wind_speed", None),
    }


def route_response_dict(resp: Any) -> Dict[str, Any]:
    """Ensure a route/dispatch response is returned as a plain dict and that
    the ai_analysis field is a string (frontend expects this).

    This is intentionally conservative and doesn't alter other keys.
    """
    # If already a dict-like object, copy to avoid accidental mutation
    if isinstance(resp, dict):
        out = dict(resp)
    else:
        # Try common conversions
        if hasattr(resp, "to_api_dict") and callable(getattr(resp, "to_api_dict")):
            try:
                out = getattr(resp, "to_api_dict")() or {}
            except Exception:
                out = {}
        elif hasattr(resp, "to_dict") and callable(getattr(resp, "to_dict")):
            try:
                out = getattr(resp, "to_dict")() or {}
            except Exception:
                out = {}
        else:
            try:
                out = dict(resp)
            except Exception:
                out = {"result": str(resp)}

    # Ensure ai_analysis is a string to avoid frontend parsing issues
    if "ai_analysis" in out and out["ai_analysis"] is not None:
        try:
            if not isinstance(out["ai_analysis"], str):
                out["ai_analysis"] = str(out["ai_analysis"]) or ""
        except Exception:
            out["ai_analysis"] = ""
    else:
        out.setdefault("ai_analysis", "")

    return out
