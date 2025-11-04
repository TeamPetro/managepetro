"""
Centralized request/response models for API endpoints.
This ensures DRY principles - if validation rules change, only update here.
"""

from pydantic import BaseModel, Field
from typing import Optional
from constants import (
    DEFAULT_LLM_MODEL,
    DEFAULT_DEPOT_LOCATION,
    DEFAULT_VEHICLE_TYPE,
    DEFAULT_FUEL_TYPE,
    TRUCK_STATUS_ACTIVE,
    TIME_MODE_DEPARTURE,
    ROUTE_TYPE_FASTEST,
    TRAVEL_MODE_CAR,
    BUDGET_TYPE_DISTANCE,
    MIN_LOCATION_LENGTH,
    MAX_LOCATION_LENGTH,
    MIN_CITY_LENGTH,
    MAX_CITY_LENGTH,
    MAX_TRUCK_CODE_LENGTH,
    MAX_PLATE_LENGTH,
    MAX_DISPATCH_RECOMMENDATIONS,
    DEFAULT_DISPATCH_RECOMMENDATIONS,
)


# Base configurations for common model settings
class StrictModel(BaseModel):
    """Base model with strict validation"""

    model_config = {
        "str_strip_whitespace": True,
        "validate_assignment": True,
        "extra": "forbid",
    }


class BasicModel(BaseModel):
    """Base model with basic validation"""

    model_config = {
        "str_strip_whitespace": True,
        "validate_assignment": True,
    }


# Coordinate validation helpers
class CoordinateMixin:
    """Mixin class for latitude/longitude validation"""

    @staticmethod
    def _lat_field(description: str = "Latitude") -> float:
        return Field(..., ge=-90, le=90, description=description)

    @staticmethod
    def _lon_field(description: str = "Longitude") -> float:
        return Field(..., ge=-180, le=180, description=description)


# Location-based requests
class LocationRequest(BasicModel):
    """Base model for requests involving locations"""

    llm_model: str = Field(
        default=DEFAULT_LLM_MODEL, description="AI model to use for optimization"
    )


class RouteRequest(StrictModel):
    """Request model for route optimization"""

    from_location: str = Field(
        ...,
        min_length=MIN_LOCATION_LENGTH,
        max_length=MAX_LOCATION_LENGTH,
        description="Starting location",
    )
    to_location: str = Field(
        ...,
        min_length=MIN_LOCATION_LENGTH,
        max_length=MAX_LOCATION_LENGTH,
        description="Destination location",
    )
    llm_model: str = Field(
        default=DEFAULT_LLM_MODEL, description="AI model to use for optimization"
    )
    use_ai_optimization: bool = Field(
        default=True, description="Enable AI-powered optimization"
    )
    departure_time: Optional[str] = Field(
        default=None, description="Desired departure time (ISO format or HH:MM)"
    )
    arrival_time: Optional[str] = Field(
        default=None, description="Desired arrival time (ISO format or HH:MM)"
    )
    time_mode: str = Field(
        default=TIME_MODE_DEPARTURE,
        pattern="^(departure|arrival)$",
        description="Time optimization mode",
    )
    delivery_date: Optional[str] = Field(
        default=None, description="Preferred delivery date (YYYY-MM-DD)"
    )
    vehicle_type: str = Field(
        default=DEFAULT_VEHICLE_TYPE, description="Type of vehicle for the route"
    )
    notes: Optional[str] = Field(
        default=None, description="Additional notes or special instructions"
    )


# Weather request
class WeatherRequest(BasicModel):
    """Request model for weather data"""

    city: str = Field(
        ...,
        min_length=MIN_CITY_LENGTH,
        max_length=MAX_CITY_LENGTH,
        description="City name for weather data",
    )


# TomTom API requests
class TomTomRouteRequest(BasicModel):
    """Request model for TomTom routing"""

    origin_lat: float = CoordinateMixin._lat_field("Origin latitude")
    origin_lon: float = CoordinateMixin._lon_field("Origin longitude")
    dest_lat: float = CoordinateMixin._lat_field("Destination latitude")
    dest_lon: float = CoordinateMixin._lon_field("Destination longitude")
    travel_mode: str = Field(default=TRAVEL_MODE_CAR, description="Travel mode")
    route_type: str = Field(
        default=ROUTE_TYPE_FASTEST, description="Route optimization type"
    )


class ReachableRangeRequest(BasicModel):
    """Request model for reachable range calculation"""

    origin_lat: float = CoordinateMixin._lat_field("Origin latitude")
    origin_lon: float = CoordinateMixin._lon_field("Origin longitude")
    budget_value: float = Field(
        ..., gt=0, description="Budget value for range calculation"
    )
    budget_type: str = Field(
        default=BUDGET_TYPE_DISTANCE,
        pattern="^(distance|time|fuel|energy)$",
        description="Budget type",
    )


# Dispatch requests
class DispatchOptimizationRequest(StrictModel):
    """Request model for single truck dispatch optimization"""

    truck_id: str = Field(..., description="Truck ID to dispatch")
    llm_model: str = Field(
        default=DEFAULT_LLM_MODEL, description="AI model to use for optimization"
    )
    depot_location: str = Field(
        default=DEFAULT_DEPOT_LOCATION, description="Starting depot location"
    )


class DispatchRecommendationsRequest(StrictModel):
    """Request model for batch dispatch recommendations"""

    llm_model: str = Field(
        default=DEFAULT_LLM_MODEL, description="AI model to use for optimization"
    )
    depot_location: str = Field(
        default=DEFAULT_DEPOT_LOCATION, description="Starting depot location"
    )
    max_recommendations: int = Field(
        default=DEFAULT_DISPATCH_RECOMMENDATIONS,
        ge=1,
        le=MAX_DISPATCH_RECOMMENDATIONS,
        description="Maximum number of dispatch recommendations to return",
    )
    filter_region: Optional[str] = Field(
        default=None, description="Filter stations by region (province/state)"
    )
    filter_city: Optional[str] = Field(
        default=None, description="Filter stations by city"
    )


# Truck creation
class TruckCreate(BasicModel):
    """Request model for creating a new truck"""

    code: str = Field(
        ..., min_length=1, max_length=MAX_TRUCK_CODE_LENGTH, description="Truck code"
    )
    plate: Optional[str] = Field(
        default=None, max_length=MAX_PLATE_LENGTH, description="License plate number"
    )
    capacity_liters: Optional[float] = Field(
        default=None, gt=0, description="Tank capacity in liters"
    )
    fuel_level_percent: Optional[int] = Field(
        default=None, ge=0, le=100, description="Current fuel level percentage"
    )
    fuel_type: str = Field(default=DEFAULT_FUEL_TYPE, description="Type of fuel")
    status: str = Field(
        default=TRUCK_STATUS_ACTIVE,
        pattern="^(active|inactive|maintenance)$",
        description="Truck status",
    )


# Dispatch execution - creates actual delivery records
class ExecuteDispatchRequest(BasicModel):
    """Request model for executing a dispatch (creates actual deliveries)"""

    truck_id: str = Field(
        ..., description="Truck identifier (code, ID, or truck-XXX format)"
    )
    station_ids: list[str] = Field(
        ..., min_length=1, description="List of station IDs/codes to deliver to"
    )
    depot_location: str = Field(
        default=DEFAULT_DEPOT_LOCATION, description="Starting depot location"
    )
    estimated_distance_km: Optional[float] = Field(
        default=None, description="Total estimated distance in kilometers"
    )
    estimated_duration_minutes: Optional[int] = Field(
        default=None, description="Total estimated duration in minutes"
    )
    notes: Optional[str] = Field(
        default=None, description="Additional notes or special instructions"
    )
