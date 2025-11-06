from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, date
from constants import (
    REQUEST_METHOD_MANUAL,
    DEFAULT_LOW_FUEL_THRESHOLD,
    DEFAULT_FUEL_CONSUMPTION_RATE,
    DEFAULT_TRUCK_FUEL_TANK_LITERS,
    DEFAULT_TRUCK_FUEL_LEVEL_PERCENT,
)
from utils.serializers import truck_api_dict


@dataclass
class WeatherData:
    """Standardized weather data structure"""

    city: str
    temp_c: float
    condition: str
    wind_kph: float
    humidity: float
    location: Optional[str] = None

    def __post_init__(self):
        """Set location alias"""
        if not self.location:
            self.location = self.city

    @classmethod
    def from_api_response(cls, data: Dict[str, Any]) -> "WeatherData":
        """Create from WeatherAPI response"""
        return cls(
            city=data["location"]["name"],
            temp_c=data["current"]["temp_c"],
            condition=data["current"]["condition"]["text"],
            wind_kph=data["current"]["wind_kph"],
            humidity=data["current"]["humidity"],
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "city": self.city,
            "location": self.location,  # For backward compatibility
            "temp_c": self.temp_c,
            "condition": self.condition,
            "wind_kph": self.wind_kph,
            "humidity": self.humidity,
        }

    def to_db_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            "city": self.city,
            "temperature": self.temp_c,  # DB field name
            "condition": self.condition,
            "wind": self.wind_kph,  # DB field name
            "humidity": self.humidity,
            "collected_at": datetime.now(),
        }


@dataclass
class StationData:
    """Standardized fuel station data"""

    id: int
    code: str
    name: str
    city: str
    region: str
    lat: float
    lon: float
    fuel_type: str
    capacity_liters: int
    current_level_liters: int
    request_method: Optional[str] = REQUEST_METHOD_MANUAL
    low_fuel_threshold: Optional[int] = DEFAULT_LOW_FUEL_THRESHOLD

    @property
    def availability(self) -> str:
        """Calculate availability status"""
        threshold = self.low_fuel_threshold or DEFAULT_LOW_FUEL_THRESHOLD
        return "Available" if self.current_level_liters > threshold else "Low Stock"

    @property
    def coordinates(self) -> Dict[str, float]:
        """Get coordinates as dict"""
        return {"lat": self.lat, "lon": self.lon}

    @property
    def needs_refuel(self) -> bool:
        """Check if station needs refuelling"""
        threshold = self.low_fuel_threshold or DEFAULT_LOW_FUEL_THRESHOLD
        return self.current_level_liters < threshold

    @property
    def fuel_level_percent(self) -> int:
        """Calculate fuel level as percentage"""
        if self.capacity_liters == 0:
            return 0
        return int((self.current_level_liters / self.capacity_liters) * 100)

    @property
    def priority_level(self) -> str:
        """Determine priority level based on fuel percentage"""
        percent = self.fuel_level_percent
        if percent < 10:
            return "Critical"
        elif percent < 30:
            return "High"
        elif percent < 50:
            return "Medium"
        else:
            return "Low"

    def distance_to(self, other_station: "StationData") -> float:
        """Calculate approximate distance to another station in km using Haversine formula"""
        from math import radians, sin, cos, sqrt, atan2

        # Earth radius in kilometers
        R = 6371.0

        lat1 = radians(self.lat)
        lon1 = radians(self.lon)
        lat2 = radians(other_station.lat)
        lon2 = radians(other_station.lon)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return R * c

    def to_api_dict(self) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            "name": self.name,
            "code": self.code,
            "location": f"{self.city}, {self.region}",
            "fuel_type": self.fuel_type.title(),
            "capacity": f"{self.capacity_liters:,.0f} L",
            "current_level": f"{self.current_level_liters:,.0f} L",
            "fuel_level_percent": self.fuel_level_percent,
            "priority_level": self.priority_level,
            "availability": self.availability,
            "coordinates": self.coordinates,
            "request_method": self.request_method,
            "needs_refuel": self.needs_refuel,
        }


@dataclass
class DeliveryData:
    """Standardized delivery data"""

    id: int
    volume_liters: int
    delivery_date: datetime
    status: str
    station_name: str
    station_code: str
    city: str
    region: str
    lat: float
    lon: float
    truck_code: str
    truck_plate: str

    def to_api_dict(self) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            "delivery_id": self.id,
            "station": f"{self.station_name} ({self.station_code})",
            "location": f"{self.city}, {self.region}",
            "volume": f"{self.volume_liters:,.0f} L",
            "date": str(self.delivery_date),
            "status": self.status.title(),
            "truck": f"{self.truck_code} ({self.truck_plate})",
            "coordinates": {"lat": self.lat, "lon": self.lon},
        }


@dataclass
class TruckData:
    """Standardized truck data"""

    id: int
    code: str
    plate: str
    capacity_liters: int  # Cargo capacity (fuel to deliver)
    fuel_level_percent: int  # Cargo fuel level
    fuel_type: str
    status: str
    compartments: Optional[List[Dict[str, Any]]] = None
    fuel_consumption_rate: Optional[float] = (
        DEFAULT_FUEL_CONSUMPTION_RATE  # Liters per 100 km (default for heavy trucks)
    )
    truck_fuel_tank_liters: Optional[int] = (
        DEFAULT_TRUCK_FUEL_TANK_LITERS  # Truck's own fuel tank (not cargo)
    )
    truck_fuel_level_percent: Optional[int] = (
        DEFAULT_TRUCK_FUEL_LEVEL_PERCENT  # Truck's own fuel level (not cargo)
    )
    # Driver information
    current_driver_id: Optional[int] = None
    driver_name: Optional[str] = None
    driver_status: Optional[str] = None
    driver_hours_remaining: Optional[float] = None
    driver_certifications: Optional[str] = None
    has_active_deliveries: Optional[bool] = None
    # Location and maintenance
    current_location: Optional[str] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None

    @property
    def max_range_km(self) -> float:
        """Calculate truck's driving range based on its own fuel tank (not cargo)"""
        if not self.fuel_consumption_rate or not self.truck_fuel_tank_liters:
            return 0.0
        current_fuel = (
            self.truck_fuel_tank_liters * self.truck_fuel_level_percent
        ) / 100
        return (current_fuel / self.fuel_consumption_rate) * 100

    @property
    def cargo_fuel_liters(self) -> int:
        """Calculate current cargo fuel in liters"""
        return int((self.capacity_liters * self.fuel_level_percent) / 100)

    @property
    def efficiency_rating(self) -> str:
        """Get efficiency rating based on fuel consumption"""
        if not self.fuel_consumption_rate:
            return "Unknown"
        if self.fuel_consumption_rate < 30:
            return "Excellent"
        elif self.fuel_consumption_rate < 35:
            return "Good"
        elif self.fuel_consumption_rate < 40:
            return "Average"
        else:
            return "Poor"

    def to_api_dict(self) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            "code": self.code,
            "plate": self.plate,
            "fuel_capacity": f"{self.capacity_liters:,.0f} L",
            "fuel_level": f"{self.fuel_level_percent}%",
            "fuel_type": self.fuel_type.title(),
            "status": self.status.title(),
            "compartments": self.compartments or [],
            "fuel_consumption_rate": self.fuel_consumption_rate,
            "max_range_km": round(self.max_range_km, 1) if self.max_range_km else None,
            "efficiency_rating": self.efficiency_rating,
            "cargo_fuel_liters": self.cargo_fuel_liters,
            "current_driver_id": self.current_driver_id,
            "driver_name": self.driver_name,
            "driver_status": self.driver_status,
            "driver_hours_remaining": self.driver_hours_remaining,
            "driver_certifications": self.driver_certifications,
            "current_location": self.current_location,
            "last_maintenance_date": (
                self.last_maintenance_date.isoformat()
                if self.last_maintenance_date
                else None
            ),
            "next_maintenance_date": (
                self.next_maintenance_date.isoformat()
                if self.next_maintenance_date
                else None
            ),
        }


class DatabaseResult:
    """Container for all database query results"""

    def __init__(
        self,
        stations: List[StationData],
        deliveries: List[DeliveryData],
        trucks: List[TruckData],
    ):
        self.stations = stations
        self.deliveries = deliveries
        self.trucks = trucks

    def to_counts_dict(self) -> Dict[str, int]:
        """Get data source counts"""
        return {
            "database_stations": len(self.stations),
            "recent_deliveries": len(self.deliveries),
            "available_trucks": len(self.trucks),
        }


class WeatherResult:
    """Container for weather data from multiple locations"""

    def __init__(self, from_location: WeatherData, to_location: WeatherData):
        self.from_location = from_location
        self.to_location = to_location

    def to_dict(self) -> Dict[str, Dict]:
        """Convert to dictionary format"""
        return {
            "from_location": self.from_location.to_dict(),
            "to_location": self.to_location.to_dict(),
        }


class RouteOptimizationResponse:
    """
    Centralized data model for route optimization API responses.

    This class acts as the single source of truth for the route optimization
    data structure. If the API response structure needs to change, only this
    class and the frontend data types need to be updated.
    """

    def __init__(
        self,
        route_summary: Dict[str, Any],
        directions: List[Dict[str, Any]],
        weather_impact: Dict[str, Any],
        traffic_conditions: Dict[str, Any],
        fuel_stations: List[Dict[str, Any]],
        recent_deliveries: List[Dict[str, Any]],
        available_trucks: List[Dict[str, Any]],
        data_sources: Dict[str, Any],
        ai_analysis: str,
    ):
        self.route_summary = route_summary
        self.directions = directions
        self.weather_impact = weather_impact
        self.traffic_conditions = traffic_conditions
        self.fuel_stations = fuel_stations
        self.recent_deliveries = recent_deliveries
        self.available_trucks = available_trucks
        self.data_sources = data_sources
        self.ai_analysis = ai_analysis

    def to_api_dict(self) -> Dict[str, Any]:
        """
        Convert to standardized API response format.

        This is the ONLY method that defines the API response structure.
        All API endpoints should use this method to ensure consistency.
        """
        return {
            "route_summary": self.route_summary,
            "directions": self.directions,
            "weather_impact": self.weather_impact,
            "traffic_conditions": self.traffic_conditions,
            "fuel_stations": self.fuel_stations,
            "recent_deliveries": self.recent_deliveries,
            "available_trucks": self.available_trucks,
            "data_sources": self.data_sources,
            "ai_analysis": self.ai_analysis,
        }

    @classmethod
    def from_parsed_data(
        cls,
        route_summary: Dict[str, Any],
        parsed_directions: List[Dict[str, Any]],
        traffic_info: Dict[str, Any],
        db_data: "DatabaseResult",
        weather_data: "WeatherResult",
        ai_response: str,
    ) -> "RouteOptimizationResponse":
        """
        Create response from parsed AI and database data.

        This factory method centralizes the logic for building the response,
        making it easy to modify the response structure in one place.
        """
        # Weather impact section
        weather_impact = {
            "from_location": {
                "city": weather_data.from_location.city,
                "temperature": f"{weather_data.from_location.temp_c}°C",
                "condition": weather_data.from_location.condition,
                "wind": f"{weather_data.from_location.wind_kph} km/h",
                "visibility": "Good",
            },
            "to_location": {
                "city": weather_data.to_location.city,
                "temperature": f"{weather_data.to_location.temp_c}°C",
                "condition": weather_data.to_location.condition,
                "wind": f"{weather_data.to_location.wind_kph} km/h",
                "visibility": "Good",
            },
            "route_impact": f"Weather conditions: {weather_data.from_location.condition}",
            "driving_conditions": (
                "Normal"
                if weather_data.from_location.condition != "Rain"
                else "Cautious"
            ),
        }

        # Use standardized to_api_dict methods from data models
        fuel_stations = [station.to_api_dict() for station in db_data.stations[:5]]
        recent_deliveries = [
            delivery.to_api_dict() for delivery in db_data.deliveries[:5]
        ]

        available_trucks = [truck_api_dict(truck) for truck in db_data.trucks[:3]]

        # Data sources
        data_sources = {
            **db_data.to_counts_dict(),
            "weather_data": "included" if weather_data else "unavailable",
            "ai_analysis": "included",
        }

        return cls(
            route_summary=route_summary,
            directions=parsed_directions,
            weather_impact=weather_impact,
            traffic_conditions=traffic_info,
            fuel_stations=fuel_stations,
            recent_deliveries=recent_deliveries,
            available_trucks=available_trucks,
            data_sources=data_sources,
            ai_analysis=ai_response,
        )


@dataclass
class DriverData:
    """Standardized driver data structure"""

    driver_id: int
    employee_id: str
    first_name: str
    last_name: str
    phone: Optional[str]
    email: Optional[str]
    license_number: str
    license_class: str
    license_expiry_date: date
    hazmat_certified: bool
    hazmat_expiry_date: Optional[date]
    tanker_endorsement: bool
    years_experience: int
    status: str
    max_hours_per_shift: float
    current_location: Optional[str]
    home_terminal: Optional[str]
    hourly_rate: Optional[float]
    certifications: Optional[str]
    hired_date: Optional[date]
    last_medical_exam: Optional[date]
    next_medical_exam: Optional[date]
    # Computed fields
    current_shift_hours: float = 0.0
    weekly_hours: float = 0.0
    assigned_truck_code: Optional[str] = None

    @property
    def full_name(self) -> str:
        """Get driver's full name"""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_available(self) -> bool:
        """Check if driver is available for dispatch"""
        if self.status != "active":
            return False
        if self.current_shift_hours >= self.max_hours_per_shift:
            return False
        if self.hazmat_certified and self.hazmat_expiry_date:
            if self.hazmat_expiry_date < date.today():
                return False
        if self.license_expiry_date < date.today():
            return False
        return True

    @property
    def hours_remaining_today(self) -> float:
        """Calculate remaining hours driver can work today"""
        return max(0, self.max_hours_per_shift - self.current_shift_hours)

    @property
    def certification_status(self) -> str:
        """Get overall certification status"""
        issues = []
        if self.license_expiry_date < date.today():
            issues.append("License Expired")
        if self.hazmat_certified and self.hazmat_expiry_date:
            if self.hazmat_expiry_date < date.today():
                issues.append("HazMat Expired")
        if self.next_medical_exam and self.next_medical_exam < date.today():
            issues.append("Medical Exam Due")

        if issues:
            return "⚠️ " + ", ".join(issues)
        return "✓ All Current"

    def to_api_dict(self) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            "driver_id": self.driver_id,
            "employee_id": self.employee_id,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "email": self.email,
            "license_number": self.license_number,
            "license_class": self.license_class,
            "license_expiry_date": (
                self.license_expiry_date.isoformat()
                if self.license_expiry_date
                else None
            ),
            "hazmat_certified": self.hazmat_certified,
            "hazmat_expiry_date": (
                self.hazmat_expiry_date.isoformat() if self.hazmat_expiry_date else None
            ),
            "tanker_endorsement": self.tanker_endorsement,
            "years_experience": self.years_experience,
            "status": self.status,
            "max_hours_per_shift": float(self.max_hours_per_shift),
            "current_shift_hours": self.current_shift_hours,
            "weekly_hours": self.weekly_hours,
            "hours_remaining_today": self.hours_remaining_today,
            "current_location": self.current_location,
            "home_terminal": self.home_terminal,
            "hourly_rate": float(self.hourly_rate) if self.hourly_rate else None,
            "certifications": self.certifications,
            "hired_date": self.hired_date.isoformat() if self.hired_date else None,
            "last_medical_exam": (
                self.last_medical_exam.isoformat() if self.last_medical_exam else None
            ),
            "next_medical_exam": (
                self.next_medical_exam.isoformat() if self.next_medical_exam else None
            ),
            "certification_status": self.certification_status,
            "is_available": self.is_available,
            "assigned_truck_code": self.assigned_truck_code,
        }


@dataclass
class DriverShiftData:
    """Driver shift data for Hours of Service tracking"""

    shift_id: int
    driver_id: int
    shift_start: datetime
    shift_end: Optional[datetime]
    total_hours: Optional[float]
    break_hours: float
    status: str
    notes: Optional[str]

    @property
    def is_active(self) -> bool:
        """Check if shift is currently active"""
        return self.status == "active" and self.shift_end is None

    def to_api_dict(self) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            "shift_id": self.shift_id,
            "driver_id": self.driver_id,
            "shift_start": self.shift_start.isoformat() if self.shift_start else None,
            "shift_end": self.shift_end.isoformat() if self.shift_end else None,
            "total_hours": float(self.total_hours) if self.total_hours else None,
            "break_hours": float(self.break_hours),
            "status": self.status,
            "notes": self.notes,
            "is_active": self.is_active,
        }
