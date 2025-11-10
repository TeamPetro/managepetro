"""
SQLAlchemy 2.0 database models for ManagePetro application.

These models correspond to the database schema and provide type-safe
database operations using SQLAlchemy's modern declarative approach.
"""

from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    DateTime,
    Date,
    Boolean,
    Enum,
    DECIMAL,
    Text,
    TIMESTAMP,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from constants import (
    DEFAULT_FUEL_TYPE,
    DEFAULT_LOW_FUEL_THRESHOLD,
    REQUEST_METHOD_MANUAL,
    TRUCK_STATUS_ACTIVE,
    DELIVERY_STATUS_PLANNED,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class User(Base):
    """User model for authentication."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Timestamps are set by application code (auth_service) for PostgreSQL/MySQL compatibility
    # Using func.current_timestamp() causes issues with PostgreSQL timezone handling
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Indexes for performance
    __table_args__ = (
        Index("idx_username", "username"),
        Index("idx_email", "email"),
    )


class Driver(Base):
    """Driver model for fuel truck operators."""

    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    license_class: Mapped[str] = mapped_column(String(10), nullable=False)
    license_expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    hazmat_certified: Mapped[bool] = mapped_column(Boolean, default=False)
    hazmat_expiry_date: Mapped[Optional[date]] = mapped_column(Date)
    tanker_endorsement: Mapped[bool] = mapped_column(Boolean, default=False)
    years_experience: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        Enum(
            "active",
            "on_leave",
            "inactive",
            name="driver_status_enum",
            native_enum=False,
        ),
        default="active",
    )
    max_hours_per_shift: Mapped[Optional[float]] = mapped_column(
        DECIMAL(4, 2), default=12.00
    )
    current_location: Mapped[Optional[str]] = mapped_column(String(255))
    home_terminal: Mapped[Optional[str]] = mapped_column(String(100))
    hourly_rate: Mapped[Optional[float]] = mapped_column(DECIMAL(8, 2))
    certifications: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    hired_date: Mapped[Optional[date]] = mapped_column(Date)
    last_medical_exam: Mapped[Optional[date]] = mapped_column(Date)
    next_medical_exam: Mapped[Optional[date]] = mapped_column(Date)
    # Timestamps should be set by application code for PostgreSQL/MySQL compatibility
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    @property
    def full_name(self) -> str:
        """Get driver's full name"""
        return f"{self.first_name} {self.last_name}"

    # Relationships
    trucks: Mapped[List["Truck"]] = relationship(
        "Truck", back_populates="current_driver"
    )
    deliveries: Mapped[List["Delivery"]] = relationship(
        "Delivery", back_populates="driver"
    )
    shifts: Mapped[List["DriverShift"]] = relationship(
        "DriverShift", back_populates="driver", cascade="all, delete-orphan"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_employee_id", "employee_id"),
        Index("idx_status", "status"),
        Index("idx_license_number", "license_number"),
    )


class Station(Base):
    """Fuel station model."""

    __tablename__ = "stations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    lat: Mapped[Optional[float]] = mapped_column(DECIMAL(9, 6))
    lon: Mapped[Optional[float]] = mapped_column(DECIMAL(9, 6))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    region: Mapped[Optional[str]] = mapped_column(String(100))
    fuel_type: Mapped[str] = mapped_column(
        Enum("diesel", "gasoline", "propane", name="fuel_type_enum", native_enum=False),
        default=DEFAULT_FUEL_TYPE,
    )
    capacity_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    current_level_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    request_method: Mapped[str] = mapped_column(
        Enum("IoT", "Manual", name="request_method_enum", native_enum=False),
        default=REQUEST_METHOD_MANUAL,
    )
    low_fuel_threshold: Mapped[Optional[float]] = mapped_column(
        DECIMAL(12, 2), default=DEFAULT_LOW_FUEL_THRESHOLD
    )

    # Relationships
    deliveries: Mapped[List["Delivery"]] = relationship(
        "Delivery", back_populates="station", cascade="all, delete-orphan"
    )
    fuel_levels: Mapped[List["StationFuelLevel"]] = relationship(
        "StationFuelLevel", back_populates="station", cascade="all, delete-orphan"
    )


class Truck(Base):
    """Truck model."""

    __tablename__ = "trucks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    plate: Mapped[Optional[str]] = mapped_column(String(32))
    capacity_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    fuel_level_percent: Mapped[Optional[int]] = mapped_column(Integer)
    fuel_type: Mapped[str] = mapped_column(
        Enum(
            "diesel",
            "gasoline",
            "propane",
            name="truck_fuel_type_enum",
            native_enum=False,
        ),
        default=DEFAULT_FUEL_TYPE,
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "active",
            "maintenance",
            "offline",
            name="truck_status_enum",
            native_enum=False,
        ),
        default=TRUCK_STATUS_ACTIVE,
    )
    current_driver_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("drivers.id", ondelete="SET NULL")
    )
    last_maintenance_date: Mapped[Optional[date]] = mapped_column(Date)
    next_maintenance_date: Mapped[Optional[date]] = mapped_column(Date)
    current_location: Mapped[Optional[str]] = mapped_column(String(255))

    # Relationships
    current_driver: Mapped[Optional["Driver"]] = relationship(
        "Driver", back_populates="trucks", foreign_keys=[current_driver_id]
    )
    deliveries: Mapped[List["Delivery"]] = relationship(
        "Delivery", back_populates="truck", cascade="all, delete-orphan"
    )
    compartments: Mapped[List["TruckCompartment"]] = relationship(
        "TruckCompartment", back_populates="truck", cascade="all, delete-orphan"
    )

    # Indexes for performance
    __table_args__ = (Index("idx_current_driver", "current_driver_id"),)


class Delivery(Base):
    """Delivery model."""

    __tablename__ = "deliveries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    truck_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("trucks.id", ondelete="CASCADE")
    )
    station_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("stations.id", ondelete="CASCADE")
    )
    driver_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("drivers.id", ondelete="SET NULL")
    )
    volume_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    delivery_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    estimated_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    actual_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    distance_km: Mapped[Optional[float]] = mapped_column(DECIMAL(8, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum(
            "planned",
            "enroute",
            "delivered",
            "canceled",
            name="delivery_status_enum",
            native_enum=False,
        ),
        default=DELIVERY_STATUS_PLANNED,
    )

    # Relationships
    truck: Mapped[Optional["Truck"]] = relationship(
        "Truck", back_populates="deliveries"
    )
    station: Mapped[Optional["Station"]] = relationship(
        "Station", back_populates="deliveries"
    )
    driver: Mapped[Optional["Driver"]] = relationship(
        "Driver", back_populates="deliveries"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_driver", "driver_id"),
        Index("idx_status", "status"),
        Index("idx_delivery_date", "delivery_date"),
    )


class StationFuelLevel(Base):
    """Station fuel level tracking."""

    __tablename__ = "station_fuel_levels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("stations.id", ondelete="CASCADE")
    )
    # recorded_at should be set by application code for PostgreSQL/MySQL compatibility
    recorded_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    fuel_level_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))

    # Relationships
    station: Mapped[Optional["Station"]] = relationship(
        "Station", back_populates="fuel_levels"
    )


class TruckCompartment(Base):
    """Truck compartment model."""

    __tablename__ = "truck_compartments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    truck_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("trucks.id", ondelete="CASCADE"), nullable=False
    )
    compartment_number: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel_type: Mapped[str] = mapped_column(
        Enum(
            "diesel",
            "gasoline",
            "propane",
            name="compartment_fuel_type_enum",
            native_enum=False,
        ),
        nullable=False,
    )
    capacity_liters: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    current_level_liters: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0)

    # Relationships
    truck: Mapped["Truck"] = relationship("Truck", back_populates="compartments")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint(
            "truck_id", "compartment_number", name="unique_truck_compartment"
        ),
    )


class WeatherData(Base):
    """Weather data model."""

    __tablename__ = "weather_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    city: Mapped[Optional[str]] = mapped_column(String(100))
    temperature: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    condition: Mapped[Optional[str]] = mapped_column(Text)
    wind: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    humidity: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    collected_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP)


class DriverShift(Base):
    """Driver shift model for Hours of Service compliance tracking."""

    __tablename__ = "driver_shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    driver_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False
    )
    shift_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    shift_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
    total_hours: Mapped[Optional[float]] = mapped_column(DECIMAL(4, 2))
    break_hours: Mapped[float] = mapped_column(DECIMAL(4, 2), default=0)
    status: Mapped[str] = mapped_column(
        Enum(
            "active",
            "completed",
            "interrupted",
            name="shift_status_enum",
            native_enum=False,
        ),
        default="active",
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    driver: Mapped["Driver"] = relationship("Driver", back_populates="shifts")

    # Indexes for performance
    __table_args__ = (
        Index("idx_driver_shift", "driver_id", "shift_start"),
        Index("idx_shift_status", "status"),
    )
