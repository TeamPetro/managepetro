import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
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
    ExecuteDispatchRequest,
)
from models.data_models import DriverData, DriverShiftData
from database import get_db_session, db_manager
from config import config
from models.database_models import (
    Truck as TruckORM,
    Station as StationORM,
    Delivery as DeliveryORM,
    Driver as DriverORM,
    DriverShift as DriverShiftORM,
    Base,
)
import logging

_logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    _logger.info("=" * 80)
    _logger.info("MANAGE PETRO API - STARTING UP")
    _logger.info("=" * 80)
    _logger.info(
        f"Environment: {'Production' if os.getenv('DATABASE_URL') else 'Development'}"
    )
    _logger.info(
        f"Database: {'PostgreSQL (Render)' if os.getenv('DATABASE_URL') else 'MySQL (Local)'}"
    )
    _logger.info(f"CORS Origins: {len(config.CORS_ORIGINS)} configured")

    # Test database connectivity
    try:
        async with db_manager.get_session() as session:
            result = await session.execute(text("SELECT 1"))
            _logger.info("✅ Database connection successful")
    except Exception as e:
        _logger.error(
            f"❌ Database connection failed: {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise  # Fail fast if database is unreachable

    # Create database tables if they don't exist
    try:
        _logger.info("Creating/verifying database tables...")

        async with db_manager.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        _logger.info("✅ Database tables created/verified successfully")
    except Exception as e:
        _logger.error(
            f"❌ Failed to create database tables: {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
        raise  # Fail fast if tables can't be created

    _logger.info("=" * 80)

    yield  # Application runs here

    # Shutdown (if needed in the future)
    _logger.info("MANAGE PETRO API - SHUTTING DOWN")


app = FastAPI(
    title="Manage Petro API",
    description="API for managing fuel delivery operations with AI-powered route optimization",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok"}


@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"status": "ok"}


# Configure logging early
configure_logging()

# Log CORS configuration for debugging
_logger.info(f"Configuring CORS with {len(config.CORS_ORIGINS)} allowed origins")
for origin in config.CORS_ORIGINS:
    _logger.debug(f"  - Allowed origin: {origin}")
if config.CORS_ORIGIN_REGEX:
    _logger.info(f"CORS origin regex pattern: {config.CORS_ORIGIN_REGEX}")

# Configure CORS
# Use CORS origins from config (supports environment variables) for better production flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
    allow_origin_regex=config.CORS_ORIGIN_REGEX,  # Support for dynamic URLs (e.g., Vercel previews)
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


# ==================== DRIVER ENDPOINTS ====================


@app.get("/api/drivers")
async def get_drivers(
    status: str = None,
    available_only: bool = False,
    session: AsyncSession = Depends(get_db_session),
):
    """Get all drivers with optional filters"""
    try:
        # Build query
        query = select(DriverORM)

        # Apply status filter
        if status:
            query = query.where(DriverORM.status == status)

        # Execute query
        result = await session.execute(query)
        drivers_orm = result.scalars().all()

        # Convert to DriverData and calculate current shift hours
        drivers = []
        for driver_orm in drivers_orm:
            # Calculate current shift hours (today)
            today_start = datetime.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            shift_query = select(DriverShiftORM).where(
                and_(
                    DriverShiftORM.driver_id == driver_orm.id,
                    DriverShiftORM.shift_start >= today_start,
                    DriverShiftORM.status == "active",
                )
            )
            shift_result = await session.execute(shift_query)
            active_shifts = shift_result.scalars().all()

            current_shift_hours = sum(
                (shift.total_hours or 0) for shift in active_shifts
            )

            # Calculate weekly hours (last 7 days)
            week_start = datetime.now() - timedelta(days=7)
            week_query = select(DriverShiftORM).where(
                and_(
                    DriverShiftORM.driver_id == driver_orm.id,
                    DriverShiftORM.shift_start >= week_start,
                    DriverShiftORM.status.in_(["active", "completed"]),
                )
            )
            week_result = await session.execute(week_query)
            week_shifts = week_result.scalars().all()

            weekly_hours = sum((shift.total_hours or 0) for shift in week_shifts)

            # Get assigned truck code
            assigned_truck_code = None
            if driver_orm.trucks:
                assigned_truck_code = driver_orm.trucks[0].code

            driver_data = DriverData(
                driver_id=driver_orm.id,
                employee_id=driver_orm.employee_id,
                first_name=driver_orm.first_name,
                last_name=driver_orm.last_name,
                phone=driver_orm.phone,
                email=driver_orm.email,
                license_number=driver_orm.license_number,
                license_class=driver_orm.license_class,
                license_expiry_date=driver_orm.license_expiry_date,
                hazmat_certified=driver_orm.hazmat_certified,
                hazmat_expiry_date=driver_orm.hazmat_expiry_date,
                tanker_endorsement=driver_orm.tanker_endorsement,
                years_experience=driver_orm.years_experience,
                status=driver_orm.status,
                max_hours_per_shift=float(driver_orm.max_hours_per_shift or 11.0),
                current_location=driver_orm.current_location,
                home_terminal=driver_orm.home_terminal,
                hourly_rate=(
                    float(driver_orm.hourly_rate) if driver_orm.hourly_rate else None
                ),
                certifications=driver_orm.certifications,
                hired_date=driver_orm.hired_date,
                last_medical_exam=driver_orm.last_medical_exam,
                next_medical_exam=driver_orm.next_medical_exam,
                current_shift_hours=current_shift_hours,
                weekly_hours=weekly_hours,
                assigned_truck_code=assigned_truck_code,
            )

            # Filter by availability if requested
            if available_only and not driver_data.is_available:
                continue

            drivers.append(driver_data.to_api_dict())

        return {"drivers": drivers, "count": len(drivers)}
    except Exception as e:
        _logger.error(f"Failed to fetch drivers: {e}")
        raise_500("Failed to fetch drivers", e)


@app.get("/api/drivers/{driver_id}")
async def get_driver(
    driver_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get a single driver by ID"""
    try:
        result = await session.execute(
            select(DriverORM).where(DriverORM.id == driver_id)
        )
        driver_orm = result.scalar_one_or_none()

        if not driver_orm:
            raise_404("Driver not found")

        # Calculate current shift hours
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        shift_query = select(DriverShiftORM).where(
            and_(
                DriverShiftORM.driver_id == driver_orm.id,
                DriverShiftORM.shift_start >= today_start,
                DriverShiftORM.status == "active",
            )
        )
        shift_result = await session.execute(shift_query)
        active_shifts = shift_result.scalars().all()

        current_shift_hours = sum((shift.total_hours or 0) for shift in active_shifts)

        # Calculate weekly hours
        week_start = datetime.now() - timedelta(days=7)
        week_query = select(DriverShiftORM).where(
            and_(
                DriverShiftORM.driver_id == driver_orm.id,
                DriverShiftORM.shift_start >= week_start,
                DriverShiftORM.status.in_(["active", "completed"]),
            )
        )
        week_result = await session.execute(week_query)
        week_shifts = week_result.scalars().all()

        weekly_hours = sum((shift.total_hours or 0) for shift in week_shifts)

        # Get assigned truck
        assigned_truck_code = None
        if driver_orm.trucks:
            assigned_truck_code = driver_orm.trucks[0].code

        driver_data = DriverData(
            driver_id=driver_orm.id,
            employee_id=driver_orm.employee_id,
            first_name=driver_orm.first_name,
            last_name=driver_orm.last_name,
            phone=driver_orm.phone,
            email=driver_orm.email,
            license_number=driver_orm.license_number,
            license_class=driver_orm.license_class,
            license_expiry_date=driver_orm.license_expiry_date,
            hazmat_certified=driver_orm.hazmat_certified,
            hazmat_expiry_date=driver_orm.hazmat_expiry_date,
            tanker_endorsement=driver_orm.tanker_endorsement,
            years_experience=driver_orm.years_experience,
            status=driver_orm.status,
            max_hours_per_shift=float(driver_orm.max_hours_per_shift or 11.0),
            current_location=driver_orm.current_location,
            home_terminal=driver_orm.home_terminal,
            hourly_rate=(
                float(driver_orm.hourly_rate) if driver_orm.hourly_rate else None
            ),
            certifications=driver_orm.certifications,
            hired_date=driver_orm.hired_date,
            last_medical_exam=driver_orm.last_medical_exam,
            next_medical_exam=driver_orm.next_medical_exam,
            current_shift_hours=current_shift_hours,
            weekly_hours=weekly_hours,
            assigned_truck_code=assigned_truck_code,
        )

        return {"driver": driver_data.to_api_dict()}
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Failed to fetch driver: {e}")
        raise_500("Failed to fetch driver", e)


@app.get("/api/drivers/{driver_id}/shifts")
async def get_driver_shifts(
    driver_id: int,
    limit: int = 10,
    session: AsyncSession = Depends(get_db_session),
):
    """Get shift history for a driver"""
    try:
        # Check if driver exists
        driver_result = await session.execute(
            select(DriverORM).where(DriverORM.id == driver_id)
        )
        if not driver_result.scalar_one_or_none():
            raise_404("Driver not found")

        # Get shifts
        query = (
            select(DriverShiftORM)
            .where(DriverShiftORM.driver_id == driver_id)
            .order_by(DriverShiftORM.shift_start.desc())
            .limit(limit)
        )

        result = await session.execute(query)
        shifts_orm = result.scalars().all()

        shifts = [
            DriverShiftData(
                shift_id=shift.id,
                driver_id=shift.driver_id,
                shift_start=shift.shift_start,
                shift_end=shift.shift_end,
                total_hours=float(shift.total_hours) if shift.total_hours else None,
                break_hours=float(shift.break_hours),
                status=shift.status,
                notes=shift.notes,
            ).to_api_dict()
            for shift in shifts_orm
        ]

        return {"shifts": shifts, "count": len(shifts)}
    except HTTPException:
        raise
    except Exception as e:
        _logger.error(f"Failed to fetch driver shifts: {e}")
        raise_500("Failed to fetch driver shifts", e)


@app.get("/api/drivers/available")
async def get_available_drivers(
    session: AsyncSession = Depends(get_db_session),
):
    """Get all available drivers (active status, within hours limit, valid certs)"""
    return await get_drivers(status="active", available_only=True, session=session)


# ==================== STATIONS ENDPOINTS ====================


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
    _logger.info(
        f"Registration attempt for username: {user_data.username}, email: {user_data.email}"
    )
    try:
        _logger.debug("Calling auth_service.create_user...")
        user = await auth_service.create_user(
            session=session,
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
        )
        _logger.info(f"User created successfully: {user.username} (ID: {user.id})")

        # Convert SQLAlchemy model to Pydantic response model
        response = User(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )
        _logger.debug(f"Returning user response: {response.username}")
        return response
    except HTTPException as he:
        _logger.warning(
            f"Registration failed with HTTPException: {he.status_code} - {he.detail}"
        )
        raise
    except Exception as e:
        _logger.error(
            f"Registration failed with unexpected error: {type(e).__name__}: {str(e)}",
            exc_info=True,
        )
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


# Execute dispatch - creates actual delivery records and starts the trip
@app.post("/api/dispatch/execute")
async def execute_dispatch(
    request: ExecuteDispatchRequest,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Execute dispatch by creating actual delivery records and updating truck status (Protected)"""
    try:
        _logger.info(
            "Execute dispatch request: truck_id=%s, stations=%s, user=%s",
            request.truck_id,
            request.station_ids,
            current_user.username,
        )

        # Parse truck_id to get the actual truck
        truck_id_str = request.truck_id

        # Handle different formats (same logic as _get_truck_by_id_sqlalchemy)
        if " - " in truck_id_str:
            truck_id_str = truck_id_str.split(" - ")[0].strip()
        if " (" in truck_id_str:
            truck_id_str = truck_id_str.split(" (")[0].strip()

        # Look up truck by code or ID
        if truck_id_str.isdigit():
            stmt = select(TruckORM).where(TruckORM.id == int(truck_id_str))
        else:
            stmt = select(TruckORM).where(TruckORM.code == truck_id_str)

        result = await session.execute(stmt)
        truck = result.scalar_one_or_none()

        if not truck:
            raise HTTPException(
                status_code=404, detail=f"Truck {request.truck_id} not found"
            )

        # Get driver if truck has one assigned
        driver_id = truck.current_driver_id
        driver = None

        # Check if driver has available hours
        if driver_id:
            driver_stmt = select(DriverORM).where(DriverORM.id == driver_id)
            driver_result = await session.execute(driver_stmt)
            driver = driver_result.scalar_one_or_none()

            if driver:
                # Calculate current shift hours
                today_start = datetime.now(timezone.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )

                shift_stmt = select(
                    func.coalesce(
                        func.sum(
                            func.timestampdiff(
                                text("HOUR"),
                                DriverShiftORM.shift_start,
                                func.coalesce(DriverShiftORM.shift_end, func.now()),
                            )
                        ),
                        0,
                    )
                ).where(
                    and_(
                        DriverShiftORM.driver_id == driver_id,
                        DriverShiftORM.shift_start >= today_start,
                    )
                )
                shift_result = await session.execute(shift_stmt)
                current_hours = float(shift_result.scalar() or 0)
                max_hours = float(driver.max_hours_per_shift)
                hours_remaining = max_hours - current_hours

                if hours_remaining <= 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Driver {driver.first_name} {driver.last_name} has no hours remaining today ({current_hours:.1f}h worked of {max_hours}h allowed)",
                    )

                _logger.info(
                    f"Driver {driver.first_name} {driver.last_name} has {hours_remaining:.1f}h remaining today"
                )

        # Create delivery records for each station
        deliveries_created = []
        delivery_date = datetime.now(timezone.utc)

        for station_id_str in request.station_ids:
            # Look up station by code or ID
            if station_id_str.isdigit():
                station_stmt = select(StationORM).where(
                    StationORM.id == int(station_id_str)
                )
            else:
                station_stmt = select(StationORM).where(
                    StationORM.code == station_id_str
                )

            station_result = await session.execute(station_stmt)
            station = station_result.scalar_one_or_none()

            if not station:
                _logger.warning(f"Station {station_id_str} not found, skipping")
                continue

            # Calculate volume needed (fill to 80% of capacity as reasonable target)
            # Convert Decimal to float to avoid type issues
            capacity = float(station.capacity_liters or 0)
            current_level = float(station.current_level_liters or 0)
            volume_needed = max(0, (capacity * 0.8) - current_level)

            # Create delivery record
            delivery = DeliveryORM(
                truck_id=truck.id,
                station_id=station.id,
                driver_id=driver_id,
                volume_liters=volume_needed,
                delivery_date=delivery_date,
                estimated_duration_minutes=request.estimated_duration_minutes,
                distance_km=request.estimated_distance_km,
                notes=request.notes,
                status="planned",  # Initially planned, will be updated as driver progresses
            )

            session.add(delivery)
            deliveries_created.append(
                {
                    "station_code": station.code,
                    "station_name": station.name,
                    "volume_liters": volume_needed,
                    "status": "planned",
                }
            )

        # Update truck status to "active" if deliveries were created
        if deliveries_created:
            truck.status = "active"
            _logger.info(f"Updated truck {truck.code} status to active")

        # Commit all changes
        await session.commit()

        _logger.info(
            f"Created {len(deliveries_created)} delivery records for truck {truck.code}"
        )

        return {
            "success": True,
            "truck_code": truck.code,
            "truck_plate": truck.plate,
            "driver_name": (
                f"{driver.first_name} {driver.last_name}"
                if driver_id and driver
                else None
            ),
            "deliveries_created": len(deliveries_created),
            "deliveries": deliveries_created,
            "total_volume_liters": sum(d["volume_liters"] for d in deliveries_created),
            "estimated_distance_km": request.estimated_distance_km,
            "estimated_duration_minutes": request.estimated_duration_minutes,
            "departure_time": delivery_date.isoformat(),
            "status": "dispatched",
            "message": f"Successfully dispatched truck {truck.code} to {len(deliveries_created)} stations",
        }

    except HTTPException:
        raise
    except Exception as e:
        _logger.error("Execute dispatch failed: %s", str(e))
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Dispatch execution failed: {str(e)}"
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
