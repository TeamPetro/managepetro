from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from services.llm_service import LLMService
from utils.serializers import (
    station_api_dict,
    truck_api_dict,
    trip_dict_from_row,
    trip_detail_from_row,
    weather_api_dict,
    route_response_dict,
)
from utils.database_utils import get_station_by_id_or_code
from utils.error_handlers import raise_500, raise_404
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
from models.request_models import (
    RouteRequest,
    WeatherRequest,
    TomTomRouteRequest,
    ReachableRangeRequest,
    DispatchOptimizationRequest,
    DispatchRecommendationsRequest,
    TruckCreate,
)
from database import get_db_session
from config import config
from constants import CORS_ORIGINS
from models.database_models import (
    Truck as TruckORM,
    Station as StationORM,
    Delivery as DeliveryORM,
)
import logging

_logger = logging.getLogger(__name__)

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
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()


# API Endpoints below
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
        raise_500("Weather service error", e)


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
        raise_500("TomTom routing error", e)


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
        raise_500("Reachable range error", e)


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
        raise_500("Failed to fetch stations", e)


# Trucks endpoint
@app.get("/api/trucks")
async def get_trucks(session: AsyncSession = Depends(get_db_session)):
    """Get all trucks from database using SQLAlchemy 2.0"""
    try:
        trucks = await llm_service.get_all_trucks_sqlalchemy(session)
        return {"trucks": [truck_api_dict(t) for t in trucks], "count": len(trucks)}
    except Exception as e:
        raise_500("Failed to fetch trucks", e)


# Get single truck by id or code
@app.get("/api/trucks/{truck_id}")
async def get_truck(truck_id: str, session: AsyncSession = Depends(get_db_session)):
    """Get a single truck by numeric id or code (e.g., 'truck-001' or 'T01')"""
    from services.llm_service import LLMService

    try:
        llm = llm_service  # reuse the existing instance
        truck = await llm._get_truck_by_id_sqlalchemy(session, truck_id)
        if not truck:
            raise_404("Truck not found")

        return {"truck": truck.to_api_dict()}
    except HTTPException:
        raise
    except Exception as e:
        raise_500("Failed to fetch truck", e)


# Create a truck (simple create endpoint)
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

        # Use the truck serializer for consistency
        return {"truck": truck_api_dict(new_truck)}
    except Exception as e:
        raise_500("Failed to create truck", e)


# Get single station by id or code
@app.get("/api/stations/{station_id}")
async def get_station(station_id: str, session: AsyncSession = Depends(get_db_session)):
    """Get a single station by numeric id or code"""
    try:
        station = await get_station_by_id_or_code(session, station_id)
        if not station:
            raise_404("Station not found")

        # Use the serializer for consistency
        return {"station": station_api_dict(station)}
    except HTTPException:
        raise
    except Exception as e:
        raise_500("Failed to fetch station", e)


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
    except Exception as e:
        raise_500("Failed to fetch trips", e)


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
            raise_404("Trip not found")

        r = row
        return {"trip": trip_detail_from_row(r)}
    except HTTPException:
        raise
    except Exception as e:
        raise_500("Failed to fetch trip", e)


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
        raise_500("Registration failed", e)


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
        raise_500("Login failed", e)


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
