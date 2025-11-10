"""
Centralized constants for the application.
Change values here to update throughout the entire app.
"""

# Default AI Model
DEFAULT_LLM_MODEL = "gemini-2.5-flash"

# Location defaults
DEFAULT_DEPOT_LOCATION = "Toronto"
DEFAULT_COUNTRY = "Canada"

# Vehicle defaults
DEFAULT_VEHICLE_TYPE = "fuel_delivery_truck"
DEFAULT_FUEL_TYPE = "diesel"
DEFAULT_TRUCK_STATUS = "active"

# Time mode options
TIME_MODE_DEPARTURE = "departure"
TIME_MODE_ARRIVAL = "arrival"

# Truck status options
TRUCK_STATUS_ACTIVE = "active"
TRUCK_STATUS_INACTIVE = "inactive"
TRUCK_STATUS_MAINTENANCE = "maintenance"

# Route type options
ROUTE_TYPE_FASTEST = "fastest"
ROUTE_TYPE_SHORTEST = "shortest"
ROUTE_TYPE_ECO = "eco"

# Travel modes
TRAVEL_MODE_CAR = "car"
TRAVEL_MODE_TRUCK = "truck"

# Budget types for reachable range
BUDGET_TYPE_DISTANCE = "distance"
BUDGET_TYPE_TIME = "time"
BUDGET_TYPE_FUEL = "fuel"
BUDGET_TYPE_ENERGY = "energy"

# Delivery status
DELIVERY_STATUS_PLANNED = "planned"
DELIVERY_STATUS_ENROUTE = "enroute"
DELIVERY_STATUS_DELIVERED = "delivered"
DELIVERY_STATUS_CANCELLED = "cancelled"

# Driver status options
DRIVER_STATUS_ACTIVE = "active"
DRIVER_STATUS_ON_LEAVE = "on_leave"
DRIVER_STATUS_INACTIVE = "inactive"

# Driver shift status
SHIFT_STATUS_ACTIVE = "active"
SHIFT_STATUS_COMPLETED = "completed"
SHIFT_STATUS_INTERRUPTED = "interrupted"

# Driver Hours of Service limits (per FMCSA regulations - adjust per jurisdiction)
MAX_DRIVING_HOURS_PER_DAY = 11  # hours
MAX_ON_DUTY_HOURS_PER_DAY = 14  # hours
REQUIRED_REST_PERIOD_HOURS = 10  # hours
MAX_DRIVING_HOURS_PER_WEEK = 60  # hours (7-day period)
MAX_DRIVING_HOURS_PER_WEEK_8DAY = 70  # hours (8-day period)

# Driver certifications
MIN_LICENSE_CLASS = "C"  # Minimum for commercial vehicles
HAZMAT_CERTIFICATION_VALIDITY_YEARS = 2
MEDICAL_EXAM_VALIDITY_YEARS = 2
MAX_DRIVER_AGE = 70  # Company policy
MIN_DRIVER_AGE = 21  # Federal minimum for interstate

# Fuel thresholds
DEFAULT_LOW_FUEL_THRESHOLD = 5000  # liters
CRITICAL_FUEL_THRESHOLD = 1000  # liters

# API limits
MAX_DISPATCH_RECOMMENDATIONS = 20
DEFAULT_DISPATCH_RECOMMENDATIONS = 5
MAX_TRIPS_LIMIT = 100
DEFAULT_TRIPS_LIMIT = 50

# Request method types
REQUEST_METHOD_MANUAL = "Manual"
REQUEST_METHOD_AUTOMATED = "Automated"
REQUEST_METHOD_SCHEDULED = "Scheduled"

# Cache TTL (seconds)
WEATHER_CACHE_TTL = 300  # 5 minutes
LLM_CACHE_TTL = 300  # 5 minutes

# Validation limits
MIN_LOCATION_LENGTH = 2
MAX_LOCATION_LENGTH = 100
MIN_CITY_LENGTH = 1
MAX_CITY_LENGTH = 50
MAX_TRUCK_CODE_LENGTH = 50
MAX_PLATE_LENGTH = 20

# Truck specifications
DEFAULT_TRUCK_FUEL_TANK_LITERS = 800  # Truck's own fuel tank capacity
DEFAULT_TRUCK_FUEL_LEVEL_PERCENT = 80  # Default fuel level in truck's tank

# Fuel consumption rates (liters per 100 km)
DEFAULT_FUEL_CONSUMPTION_RATE = 35.0  # Heavy trucks
EXCELLENT_FUEL_CONSUMPTION = 30.0
GOOD_FUEL_CONSUMPTION = 35.0
AVERAGE_FUEL_CONSUMPTION = 40.0
POOR_FUEL_CONSUMPTION = 45.0

# CORS allowed origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:5173",  # Vite dev server
    "https://manage-petro-frontend.vercel.app",  # Production frontend
]
