from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from services.llm_service import LLMService
from utils.serializers import (
    station_api_dict,
    truck_api_dict,
    trip_dict_from_row,
    trip_detail_from_row,
    weather_api_dict,
    route_response_dict,
)
import logging

_logger = logging.getLogger(__name__)


def _raise_logged_http_500(message: str):
    _logger.exception(message)
    raise HTTPException(status_code=500, detail="Internal server error")


from services.api_utils import (
    get_weather_async,
    calculate_route_async,
    calculate_reachable_range_async,
)
from services.auth_service import (
    auth_service,
    get_current_active_user,
)
from logging_config import configure_logging
from models.auth_models import UserCreate, User, Token
from database import get_db_session
from config import config
from models.database_models import (
    Truck as TruckORM,
    Station as StationORM,
    Delivery as DeliveryORM,
)


app = FastAPI(
    title="Manage Petro API",
    description="API for managing fuel delivery operations with AI-powered route optimization",
    version="1.0.0",
)


@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok"}


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}


# Configure logging early
configure_logging()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:3001",  # Alternative React port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()


# Pydantic models for request/response (Updated for Pydantic v2)
class RouteRequest(BaseModel):
    model_config = {
        "str_strip_whitespace": True,
        "validate_assignment": True,
        "extra": "forbid",
    }

    from_location: str = Field(
        ..., min_length=2, max_length=100, description="Starting location"
    )
    to_location: str = Field(
        ..., min_length=2, max_length=100, description="Destination location"
    )
    llm_model: str = Field(default="gemini-2.5-flash", description="AI model to use")
    use_ai_optimization: bool = Field(
        default=True, description="Enable AI-powered optimization"
    )
    departure_time: str | None = Field(
        default=None, description="Desired departure time (ISO format or HH:MM)"
    )
    arrival_time: str | None = Field(
        default=None, description="Desired arrival time (ISO format or HH:MM)"
    )
    time_mode: str = Field(
        default="departure",
        pattern="^(departure|arrival)$",
        description="Time optimization mode",
    )
    delivery_date: str | None = Field(
        default=None, description="Preferred delivery date (YYYY-MM-DD)"
    )
    vehicle_type: str = Field(
        default="fuel_delivery_truck", description="Type of vehicle for the route"
    )
    notes: str | None = Field(
        default=None, description="Additional notes or special instructions"
    )


class WeatherRequest(BaseModel):
    model_config = {"str_strip_whitespace": True}

    city: str = Field(
        ..., min_length=1, max_length=50, description="City name for weather data"
    )


class TomTomRouteRequest(BaseModel):
    model_config = {"validate_assignment": True}

    origin_lat: float = Field(..., ge=-90, le=90, description="Origin latitude")
    origin_lon: float = Field(..., ge=-180, le=180, description="Origin longitude")
    dest_lat: float = Field(..., ge=-90, le=90, description="Destination latitude")
    dest_lon: float = Field(..., ge=-180, le=180, description="Destination longitude")
    travel_mode: str = Field(default="car", description="Travel mode")
    route_type: str = Field(default="fastest", description="Route optimization type")


class ReachableRangeRequest(BaseModel):
    model_config = {"validate_assignment": True}

    origin_lat: float = Field(..., ge=-90, le=90, description="Origin latitude")
    origin_lon: float = Field(..., ge=-180, le=180, description="Origin longitude")
    budget_value: float = Field(
        ..., gt=0, description="Budget value for range calculation"
    )
    budget_type: str = Field(
        default="distance",
        pattern="^(distance|time|fuel|energy)$",
        description="Budget type",
    )


class DispatchOptimizationRequest(BaseModel):
    model_config = {"validate_assignment": True, "extra": "forbid"}

    truck_id: str = Field(..., description="Truck ID to dispatch")
    llm_model: str = Field(default="gemini-2.5-flash", description="AI model to use")
    depot_location: str = Field(
        default="Toronto", description="Starting depot location"
    )


class DispatchRecommendationsRequest(BaseModel):
    model_config = {"validate_assignment": True, "extra": "forbid"}

    llm_model: str = Field(default="gemini-2.5-flash", description="AI model to use")
    depot_location: str = Field(
        default="Toronto", description="Starting depot location"
    )
    max_recommendations: int = Field(
        default=5, description="Maximum number of dispatch recommendations to return"
    )
    filter_region: Optional[str] = Field(
        default=None, description="Filter stations by region (province/state)"
    )
    filter_city: Optional[str] = Field(
        default=None, description="Filter stations by city"
    )


@app.post("/api/routes/optimize")
async def optimize_route_ai(
    request: RouteRequest,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session),
):
    """AI-powered route optimization using markdown-refined prompts (Protected)"""
    try:
        # Always use AI service - removed conditional check to match dispatch endpoint
        result = await llm_service.optimize_route(
            request.from_location,
            request.to_location,
            session,
            request.llm_model,
            departure_time=request.departure_time,
            arrival_time=request.arrival_time,
            time_mode=request.time_mode,
            delivery_date=request.delivery_date,
            vehicle_type=request.vehicle_type,
            notes=request.notes,
        )
        # Add user info to response and ensure ai_analysis is a string
        result["requested_by"] = current_user.username
        return route_response_dict(result)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Route optimization failed: {str(e)}"
        )


# Weather endpoint (refactored)
@app.post("/api/weather")
async def get_weather_info(request: WeatherRequest):
    """Get current weather information for a city"""
    try:
        weather_data = await get_weather_async(request.city)
        return {"city": request.city, "weather": weather_api_dict(weather_data)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}")


# TomTom route endpoint (refactored)
@app.post("/api/routes/tomtom")
async def calculate_tomtom_route(request: TomTomRouteRequest):
    """Calculate route using TomTom API"""
    try:
        origin = (request.origin_lat, request.origin_lon)
        destination = (request.dest_lat, request.dest_lon)

        route_data = await calculate_route_async(
            origin=origin,
            destination=destination,
            travelMode=request.travel_mode,
            routeType=request.route_type,
        )

        return {"origin": origin, "destination": destination, "route_data": route_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TomTom routing error: {str(e)}")


# Reachable range endpoint (refactored)
@app.post("/api/routes/reachable-range")
async def calculate_range(request: ReachableRangeRequest):
    """Calculate reachable range using TomTom API"""
    try:
        origin = (request.origin_lat, request.origin_lon)

        range_data = await calculate_reachable_range_async(
            origin=origin,
            budget_value=request.budget_value,
            budget_type=request.budget_type,
        )

        return {
            "origin": origin,
            "budget_type": request.budget_type,
            "budget_value": request.budget_value,
            "range_data": range_data,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reachable range error: {str(e)}")


# Stations endpoint
@app.get("/api/stations")
async def get_stations(session: AsyncSession = Depends(get_db_session)):
    """Get all stations from database using SQLAlchemy 2.0"""
    try:
        stations = await llm_service.get_all_stations_sqlalchemy(session)
        return {
            "stations": [station_api_dict(s) for s in stations],
            "count": len(stations),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch stations: {str(e)}"
        )


# Trucks endpoint
@app.get("/api/trucks")
async def get_trucks(session: AsyncSession = Depends(get_db_session)):
    """Get all trucks from database using SQLAlchemy 2.0"""
    try:
        trucks = await llm_service.get_all_trucks_sqlalchemy(session)
        return {"trucks": [truck_api_dict(t) for t in trucks], "count": len(trucks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trucks: {str(e)}")


# Get single truck by id or code
@app.get("/api/trucks/{truck_id}")
async def get_truck(truck_id: str, session: AsyncSession = Depends(get_db_session)):
    """Get a single truck by numeric id or code (e.g., 'truck-001' or 'T01')"""
    from services.llm_service import LLMService

    try:
        llm = llm_service  # reuse the existing instance
        truck = await llm._get_truck_by_id_sqlalchemy(session, truck_id)
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")

        return {"truck": truck.to_api_dict()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch truck: {str(e)}")


# Create a truck (simple create endpoint)
class TruckCreate(BaseModel):
    model_config = {"validate_assignment": True}

    code: str
    plate: str | None = None
    capacity_liters: float | None = None
    fuel_level_percent: int | None = None
    fuel_type: str = "diesel"
    status: str = "active"


@app.post("/api/trucks")
async def create_truck(
    truck_data: TruckCreate, session: AsyncSession = Depends(get_db_session)
):
    """Create a new truck record"""
    try:
        new_truck = TruckORM(
            code=truck_data.code,
            plate=truck_data.plate,
            capacity_liters=truck_data.capacity_liters,
            fuel_level_percent=truck_data.fuel_level_percent,
            fuel_type=truck_data.fuel_type,
            status=truck_data.status,
        )
        session.add(new_truck)
        await session.commit()
        await session.refresh(new_truck)

        return {
            "truck": {
                "truck_id": f"truck-{new_truck.id:03d}",
                "plate_number": new_truck.plate,
                "capacity_liters": new_truck.capacity_liters,
                "fuel_level_percent": new_truck.fuel_level_percent,
                "fuel_type": new_truck.fuel_type,
                "status": new_truck.status,
                "code": new_truck.code,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create truck: {str(e)}")


# Get single station by id or code
@app.get("/api/stations/{station_id}")
async def get_station(station_id: str, session: AsyncSession = Depends(get_db_session)):
    """Get a single station by numeric id or code"""
    try:
        # Accept formats like 'station-001' or numeric or code
        if station_id.startswith("station-"):
            try:
                numeric = int(station_id.split("-")[1])
                stmt = select(StationORM).where(StationORM.id == numeric)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid station id format")
        elif station_id.isdigit():
            stmt = select(StationORM).where(StationORM.id == int(station_id))
        else:
            stmt = select(StationORM).where(StationORM.code == station_id)

        result = await session.execute(stmt)
        station = result.scalar_one_or_none()
        if not station:
            raise HTTPException(status_code=404, detail="Station not found")

        # Map to API format consistent with /api/stations list
        station_payload = {
            "station_id": f"station-{station.id:03d}",
            "name": station.name,
            "city": station.city,
            "region": station.region,
            "country": "Canada",
            "fuel_type": station.fuel_type,
            "capacity_liters": station.capacity_liters,
            "current_level_liters": station.current_level_liters,
            "fuel_level": (
                int((station.current_level_liters / station.capacity_liters) * 100)
                if station.capacity_liters and station.capacity_liters > 0
                else 0
            ),
            "code": station.code,
            "lat": float(station.lat) if station.lat is not None else None,
            "lon": float(station.lon) if station.lon is not None else None,
            "request_method": station.request_method or "Manual",
            "low_fuel_threshold": station.low_fuel_threshold or 5000,
            "needs_refuel": station.current_level_liters
            < (station.low_fuel_threshold or 5000),
        }

        return {"station": station_payload}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch station: {str(e)}"
        )


# Trips endpoints (deliveries)
@app.get("/api/trips")
async def get_trips(
    limit: int = 50,
    successful_only: bool = False,
    session: AsyncSession = Depends(get_db_session),
):
    """Get recent trips/deliveries"""
    try:
        stmt = select(
            DeliveryORM.id,
            DeliveryORM.volume_liters,
            DeliveryORM.delivery_date,
            DeliveryORM.status,
            StationORM.name.label("station_name"),
            StationORM.code.label("station_code"),
            StationORM.city,
            StationORM.region,
            StationORM.lat,
            StationORM.lon,
        ).join(StationORM, DeliveryORM.station_id == StationORM.id)

        if successful_only:
            stmt = stmt.where(DeliveryORM.status == "delivered")

        stmt = stmt.order_by(DeliveryORM.delivery_date.desc()).limit(limit)

        result = await session.execute(stmt)
        rows = result.all()

        trips = [trip_dict_from_row(r) for r in rows]
        return {"trips": trips, "count": len(trips)}
    except Exception:
        _raise_logged_http_500("Failed to fetch trips")


@app.get("/api/trips/{trip_id}")
async def get_trip(trip_id: int, session: AsyncSession = Depends(get_db_session)):
    """Get a single trip/delivery by id"""
    try:
        stmt = (
            select(
                DeliveryORM.id,
                DeliveryORM.volume_liters,
                DeliveryORM.delivery_date,
                DeliveryORM.status,
                StationORM.name.label("station_name"),
                StationORM.code.label("station_code"),
                StationORM.city,
                StationORM.region,
                StationORM.lat,
                StationORM.lon,
                TruckORM.code.label("truck_code"),
                TruckORM.plate.label("truck_plate"),
            )
            .join(StationORM, DeliveryORM.station_id == StationORM.id)
            .join(TruckORM, DeliveryORM.truck_id == TruckORM.id)
            .where(DeliveryORM.id == trip_id)
        )

        result = await session.execute(stmt)
        row = result.one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Trip not found")

        r = row
        return {"trip": trip_detail_from_row(r)}
    except HTTPException:
        raise
    except Exception:
        _raise_logged_http_500("Failed to fetch trip")


# Health check endpoint
@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "ai_optimization": "available",
            "weather_api": "available",
            "tomtom_routing": "available",
        },
    }


# ===== AUTHENTICATION ENDPOINTS =====


@app.post("/auth/register", response_model=User)
async def register_user(
    user_data: UserCreate, session: AsyncSession = Depends(get_db_session)
):
    """Register a new user using SQLAlchemy 2.0"""
    try:
        user = await auth_service.create_user(
            session=session,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
        )
        # Convert SQLAlchemy model to Pydantic response model
        return User(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/auth/token", response_model=Token)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_db_session),
):
    """Login user and return JWT token using SQLAlchemy 2.0"""
    try:
        user = await auth_service.authenticate_user(
            session=session, username=form_data.username, password=form_data.password
        )
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=int(access_token_expires.total_seconds()),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user


@app.post("/auth/logout")
async def logout_user():
    """Logout user (client should delete token)"""
    return {"message": "Successfully logged out"}


# ===== END AUTHENTICATION ENDPOINTS =====


# Dispatch optimization endpoint
@app.post("/api/dispatch/optimize")
async def optimize_dispatch(
    request: DispatchOptimizationRequest,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session),
):
    """AI-powered dispatch optimization for trucks to stations needing fuel (Protected)"""
    try:
        _logger.info(
            "Dispatch optimize request: truck_id=%s, depot=%s, user=%s",
            request.truck_id,
            request.depot_location,
            current_user.username,
        )

        result = await llm_service.optimize_dispatch(
            truck_id=request.truck_id,
            depot_location=request.depot_location,
            session=session,
            llm_model=request.llm_model,
        )
        # Add user info to response and ensure ai_analysis is a string
        result["requested_by"] = current_user.username
        _logger.info(
            "Dispatch optimize completed successfully for truck_id=%s", request.truck_id
        )
        return route_response_dict(result)
    except Exception as e:
        _logger.error(
            "Dispatch optimize failed for truck_id=%s: %s", request.truck_id, str(e)
        )
        raise HTTPException(
            status_code=500, detail=f"Dispatch optimization failed: {str(e)}"
        )


# Batch dispatch recommendations endpoint
@app.post("/api/dispatch/recommendations")
async def get_dispatch_recommendations(
    request: DispatchRecommendationsRequest,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session),
):
    """AI-powered batch dispatch recommendations for optimal truck-station matching (Protected)"""
    try:
        result = await llm_service.get_dispatch_recommendations(
            depot_location=request.depot_location,
            session=session,
            llm_model=request.llm_model,
            max_recommendations=request.max_recommendations,
            filter_region=request.filter_region,
            filter_city=request.filter_city,
        )
        # Add user info to response
        result["requested_by"] = current_user.username
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dispatch recommendations failed: {str(e)}"
        )


# Get available regions and cities for filtering
@app.get("/api/dispatch/filters")
async def get_dispatch_filters(
    session: AsyncSession = Depends(get_db_session),
):
    """Get available regions and cities for filtering dispatch recommendations (Protected)"""
    try:
        # Get distinct regions and cities from stations needing fuel
        regions_stmt = (
            select(StationORM.region)
            .distinct()
            .where(
                and_(
                    StationORM.current_level_liters.isnot(None),
                    StationORM.capacity_liters.isnot(None),
                    StationORM.low_fuel_threshold.isnot(None),
                    StationORM.current_level_liters < StationORM.low_fuel_threshold,
                    StationORM.region.isnot(None),
                )
            )
            .order_by(StationORM.region)
        )

        cities_stmt = (
            select(StationORM.city, StationORM.region)
            .distinct()
            .where(
                and_(
                    StationORM.current_level_liters.isnot(None),
                    StationORM.capacity_liters.isnot(None),
                    StationORM.low_fuel_threshold.isnot(None),
                    StationORM.current_level_liters < StationORM.low_fuel_threshold,
                    StationORM.city.isnot(None),
                )
            )
            .order_by(StationORM.region, StationORM.city)
        )

        regions_result = await session.execute(regions_stmt)
        cities_result = await session.execute(cities_stmt)

        regions = [r[0] for r in regions_result.all()]
        cities_data = [{"city": c[0], "region": c[1]} for c in cities_result.all()]

        return {
            "regions": regions,
            "cities": cities_data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get dispatch filters: {str(e)}"
        )
