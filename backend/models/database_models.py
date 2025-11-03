"""
SQLAlchemy 2.0 database models for ManagePetro application.

These models correspond to the database schema and provide type-safe
database operations using SQLAlchemy's modern declarative approach.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    String,
    Integer,
    DateTime,
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.current_timestamp(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_username", "username"),
        Index("idx_email", "email"),
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
        Enum("diesel", "gasoline", "propane", name="fuel_type_enum"),
        default=DEFAULT_FUEL_TYPE,
    )
    capacity_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    current_level_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    request_method: Mapped[str] = mapped_column(
        Enum("IoT", "Manual", name="request_method_enum"), default=REQUEST_METHOD_MANUAL
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
        Enum("diesel", "gasoline", "propane", name="truck_fuel_type_enum"),
        default=DEFAULT_FUEL_TYPE,
    )
    status: Mapped[str] = mapped_column(
        Enum("active", "maintenance", "offline", name="truck_status_enum"),
        default=TRUCK_STATUS_ACTIVE,
    )

    # Relationships
    deliveries: Mapped[List["Delivery"]] = relationship(
        "Delivery", back_populates="truck", cascade="all, delete-orphan"
    )
    compartments: Mapped[List["TruckCompartment"]] = relationship(
        "TruckCompartment", back_populates="truck", cascade="all, delete-orphan"
    )


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
    volume_liters: Mapped[Optional[float]] = mapped_column(DECIMAL(12, 2))
    delivery_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(
        Enum(
            "planned", "enroute", "delivered", "canceled", name="delivery_status_enum"
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


class StationFuelLevel(Base):
    """Station fuel level tracking."""

    __tablename__ = "station_fuel_levels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("stations.id", ondelete="CASCADE")
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.current_timestamp()
    )
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
        Enum("diesel", "gasoline", "propane", name="compartment_fuel_type_enum"),
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
