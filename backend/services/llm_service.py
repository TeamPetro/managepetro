# from google import genai
# from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
from .prompt_service import PromptService
from .api_utils import get_weather_async
import re
from models.database_models import Station, Truck, Delivery
from models.data_models import (
    StationData,
    DeliveryData,
    TruckData,
    DatabaseResult,
    WeatherResult,
    WeatherData,
    RouteOptimizationResponse,
)
from typing import Dict, Any, Optional, List
import logging
from constants import TRUCK_STATUS_ACTIVE
from utils.serializers import station_available_dict, truck_simple_dict
from utils.orm_converters import convert_truck_orm_to_data, convert_stations_list
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .lc_router import get_chat_model
from constants import DEFAULT_LLM_MODEL, DEFAULT_VEHICLE_TYPE, TIME_MODE_DEPARTURE
import os
import asyncio
import time
import hashlib


class LLMService:
    def __init__(self):
        self.prompt_service = PromptService()
        self._logger = logging.getLogger(__name__)
        # Simple in-memory cache for expensive operations
        self._weather_cache = {}
        self._llm_cache = {}
        self._cache_ttl = 300  # 5 minutes cache TTL

        # Pre-compile regex patterns for better performance
        self._script_regex = re.compile(r"(?i)<script.*?>.*?</script>", re.DOTALL)
        self._directions_regex = re.compile(
            r"(\d+)\.\s*(.*?)(?=\d+\.|$)", re.MULTILINE | re.DOTALL
        )
        self._section_regex = re.compile(
            r"###\s*([^#\n]+?)\s*\n\s*(.*?)\s*(?=###|$)", re.DOTALL
        )

    def clear_cache(self):
        """Clear all cached data - useful for debugging or forcing fresh API calls"""
        self._weather_cache.clear()
        self._llm_cache.clear()
        self._logger.info("Cache cleared")

    def _extract_section(self, ai_response: str, section_name: str) -> str:
        """
        Helper method to extract a section from AI response using simple string operations
        Returns the content between section_name and next ### or ## marker
        """
        try:
            # Try with ### first (three hashes), then ## (two hashes)
            for hash_count in ["###", "##"]:
                section_marker = f"{hash_count} {section_name.upper()}"
                if section_marker in ai_response:
                    # Find the start of the section
                    start_idx = ai_response.find(section_marker)
                    if start_idx == -1:
                        continue

                    # Move past the section header
                    content_start = start_idx + len(section_marker)
                    # Skip any leading whitespace/newlines
                    while (
                        content_start < len(ai_response)
                        and ai_response[content_start] in "\n\r\t "
                    ):
                        content_start += 1

                    # Find the next section marker (try both ### and ##)
                    next_section_markers = []
                    for next_marker in ["### ", "## "]:  # Look for any next section
                        marker_idx = ai_response.find(next_marker, content_start)
                        if marker_idx != -1:
                            next_section_markers.append(marker_idx)

                    if next_section_markers:
                        end_idx = min(next_section_markers)
                    else:
                        end_idx = len(ai_response)

                    content = ai_response[content_start:end_idx].strip()
                    return content

            return ""

        except Exception:
            return ""

    def _clean_markdown(self, text: str) -> str:
        """
        Remove markdown formatting from text.
        Removes bold (**), italic (*), and other common markdown syntax.
        """
        if not text:
            return text

        cleaned = text
        # Remove bold markdown (**text**)
        cleaned = re.sub(r"\*\*(.+?)\*\*", r"\1", cleaned)
        # Remove italic markdown (*text* but not ** which is already handled)
        cleaned = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", cleaned)
        # Remove underline markdown (__text__ and _text_)
        cleaned = re.sub(r"__(.+?)__", r"\1", cleaned)
        cleaned = re.sub(r"_(.+?)_", r"\1", cleaned)
        # Remove standalone ** or * that weren't part of pairs
        cleaned = re.sub(r"\*\*", "", cleaned)
        cleaned = re.sub(r"(?<!\w)\*(?!\w)", "", cleaned)

        return cleaned.strip()

    def _parse_key_value_lines(self, text: str, mappings: dict) -> Dict[str, Any]:
        """
        Helper method to parse key-value pairs from text lines
        mappings: dict of {search_key: result_key}
        Example: {"Total Distance:": "total_distance"}
        """
        result = {}
        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            for search_key, result_key in mappings.items():
                if search_key in line:
                    # Split only once after the search key to preserve time values (e.g., "6:00 AM")
                    parts = line.split(search_key, 1)
                    if len(parts) > 1:
                        value = parts[1].strip()
                        if value:  # Only add if not empty
                            # Clean markdown formatting from the value
                            result[result_key] = self._clean_markdown(value)
                    break  # Move to next line after finding a match

        return result

    async def optimize_route(
        self,
        from_location: str,
        to_location: str,
        session: AsyncSession,
        llm_model: str = None,
        departure_time: Optional[str] = None,
        arrival_time: Optional[str] = None,
        time_mode: str = TIME_MODE_DEPARTURE,
        delivery_date: Optional[str] = None,
        vehicle_type: str = DEFAULT_VEHICLE_TYPE,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate route optimization using standardized data models with SQLAlchemy 2.0"""

        # Use default model if not provided
        if llm_model is None:
            llm_model = os.getenv("DEFAULT_LLM_MODEL", DEFAULT_LLM_MODEL)

        # Get standardized data using SQLAlchemy
        db_data = await self._get_database_data_sqlalchemy(
            session, from_location, to_location
        )
        weather_data = await self._get_weather_data(from_location, to_location)

        # Create prompt with standardized data
        comprehensive_prompt = self.prompt_service.format_comprehensive_prompt(
            from_location=from_location,
            to_location=to_location,
            stations_data=db_data.stations,
            historical_routes=db_data.deliveries,
            weather_data=weather_data,
            vehicle_type=vehicle_type,
            departure_time=departure_time,
            arrival_time=arrival_time,
            time_mode=time_mode,
            delivery_date=delivery_date,
            notes=notes,
        )

        # Get AI analysis (with error handling to prevent route optimization failure)
        ai_response = ""
        try:
            ai_response = await self._call_llm(comprehensive_prompt, llm_model)
        except Exception as e:
            self._logger.warning(
                "LLM call failed for route optimization, continuing without AI analysis: %s",
                e,
            )
            ai_response = (
                "AI analysis unavailable due to service temporarily unavailable."
            )

        # Debug: log ai response type/size for troubleshooting frontend display issues
        try:
            self._logger.debug(
                "optimize_route received ai_response type=%s length=%s",
                type(ai_response),
                len(ai_response) if ai_response is not None else 0,
            )
            if ai_response:
                # Truncate preview to avoid logging excessive content
                self._logger.debug("ai_response preview: %s", str(ai_response)[:300])
        except Exception:
            # Defensive: avoid crashing on unexpected ai_response shapes
            self._logger.exception("optimize_route ai_response repr logging failed")
        return self._parse_comprehensive_response(
            ai_response, db_data, weather_data, departure_time, arrival_time, time_mode
        )

    async def optimize_dispatch(
        self,
        truck_id: str,
        depot_location: str,
        session: AsyncSession,
        llm_model: str = None,
    ) -> Dict[str, Any]:
        """Optimize dispatch route for a truck to deliver fuel to stations in need using SQLAlchemy 2.0"""

        # Use default model if not provided
        if llm_model is None:
            llm_model = os.getenv("DEFAULT_LLM_MODEL", DEFAULT_LLM_MODEL)

        try:
            self._logger.info(
                "Starting dispatch optimization for truck_id: %s, depot: %s",
                truck_id,
                depot_location,
            )
            # Get truck details using SQLAlchemy
            truck = await self._get_truck_by_id_sqlalchemy(session, truck_id)
            if not truck:
                self._logger.error("Truck not found: %s", truck_id)
                raise ValueError(f"Truck {truck_id} not found")

            # Get stations needing fuel using SQLAlchemy
            stations_needing_fuel = await self._get_stations_needing_refuel_sqlalchemy(
                session
            )

            # Get weather for depot location
            try:
                depot_weather = await get_weather_async(depot_location)
            except:
                depot_weather = WeatherData(depot_location, 20, "Clear", 10, 50)

            # Create dispatch optimization prompt
            prompt = self._create_dispatch_prompt(
                truck=truck,
                stations=stations_needing_fuel,
                depot_location=depot_location,
                depot_weather=depot_weather,
            )

            # Get AI optimization (with error handling)
            ai_response = ""
            try:
                ai_response = await self._call_llm(prompt, llm_model)
            except Exception as e:
                self._logger.warning(
                    "LLM call failed for dispatch optimization, continuing without AI analysis: %s",
                    e,
                )
                ai_response = (
                    "AI analysis unavailable due to service temporarily unavailable."
                )

            # Debug: log ai response type/size for troubleshooting frontend display issues
            try:
                self._logger.debug(
                    "optimize_dispatch received ai_response type=%s length=%s",
                    type(ai_response),
                    len(ai_response) if ai_response is not None else 0,
                )
                if ai_response:
                    self._logger.debug(
                        "ai_response preview: %s", str(ai_response)[:300]
                    )
            except Exception:
                self._logger.exception(
                    "optimize_dispatch ai_response repr logging failed"
                )

            # Parse and return dispatch plan
            return self._parse_dispatch_response(
                ai_response=ai_response,
                truck=truck,
                stations=stations_needing_fuel,
                depot_location=depot_location,
            )

        except Exception as e:
            print(f"Dispatch optimization failed: {e}")
            raise

    async def get_dispatch_recommendations(
        self,
        depot_location: str,
        session: AsyncSession,
        llm_model: str = None,
        max_recommendations: int = 5,
        filter_region: Optional[str] = None,
        filter_city: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get AI-powered batch dispatch recommendations for optimal truck-station matching"""

        # Use default model if not provided
        if llm_model is None:
            llm_model = os.getenv("DEFAULT_LLM_MODEL", DEFAULT_LLM_MODEL)

        try:
            # Get all active trucks
            trucks = await self._get_active_trucks_sqlalchemy(session)
            if not trucks:
                return {
                    "recommendations": [],
                    "summary": "No active trucks available",
                    "total_trucks": 0,
                    "total_stations": 0,
                }

            # Get stations needing fuel with optional filters
            stations_needing_fuel = await self._get_stations_needing_refuel_sqlalchemy(
                session, filter_region=filter_region, filter_city=filter_city
            )
            if not stations_needing_fuel:
                filter_msg = ""
                if filter_region:
                    filter_msg = f" in region {filter_region}"
                if filter_city:
                    filter_msg = f" in {filter_city}"
                return {
                    "recommendations": [],
                    "summary": f"No stations requiring fuel delivery{filter_msg}",
                    "total_trucks": len(trucks),
                    "total_stations": 0,
                    "filter_region": filter_region,
                    "filter_city": filter_city,
                }

            # Get weather for depot location
            try:
                depot_weather = await get_weather_async(depot_location)
            except:
                depot_weather = WeatherData(depot_location, 20, "Clear", 10, 50)

            # Create batch dispatch recommendations prompt
            prompt = self._create_batch_dispatch_prompt(
                trucks=trucks,
                stations=stations_needing_fuel,
                depot_location=depot_location,
                depot_weather=depot_weather,
                max_recommendations=max_recommendations,
            )

            # Get AI recommendations (with error handling)
            ai_response = ""
            try:
                ai_response = await self._call_llm(prompt, llm_model)
            except Exception as e:
                self._logger.warning(
                    "LLM call failed for dispatch recommendations, returning basic recommendations: %s",
                    e,
                )
                ai_response = (
                    "AI analysis unavailable due to service temporarily unavailable."
                )

            # Parse and return recommendations
            result = self._parse_batch_dispatch_response(
                ai_response=ai_response,
                trucks=trucks,
                stations=stations_needing_fuel,
                depot_location=depot_location,
            )

            # Add driver information to each recommendation
            truck_lookup = {truck.code: truck for truck in trucks}
            for rec in result.get("recommendations", []):
                truck_code = rec.get("truck_code")
                if truck_code and truck_code in truck_lookup:
                    truck = truck_lookup[truck_code]
                    rec["driver_name"] = truck.driver_name
                    rec["driver_hours_remaining"] = truck.driver_hours_remaining
                    rec["truck_plate"] = truck.plate
                    rec["truck_status"] = truck.status

            # Add filter information to response
            result["filter_region"] = filter_region
            result["filter_city"] = filter_city

            return result

        except Exception as e:
            print(f"Batch dispatch recommendations failed: {e}")
            raise

    async def _get_database_data_sqlalchemy(
        self, session: AsyncSession, from_location: str, to_location: str
    ) -> DatabaseResult:
        """Query database using SQLAlchemy 2.0 with optimized parallel queries"""
        try:
            # Execute all three queries in parallel using asyncio.gather

            async def get_stations():
                stations_stmt = (
                    select(Station)
                    .where(Station.current_level_liters > 1000)
                    .order_by(Station.capacity_liters.desc())
                    .limit(10)
                )
                result = await session.execute(stations_stmt)
                stations_orm = result.scalars().all()
                return convert_stations_list(stations_orm)

            async def get_deliveries():
                deliveries_stmt = (
                    select(
                        Delivery.id,
                        Delivery.volume_liters,
                        Delivery.delivery_date,
                        Delivery.status,
                        Station.name.label("station_name"),
                        Station.code.label("station_code"),
                        Station.city,
                        Station.region,
                        Station.lat,
                        Station.lon,
                        Truck.code.label("truck_code"),
                        Truck.plate.label("truck_plate"),
                    )
                    .join(Station, Delivery.station_id == Station.id)
                    .join(Truck, Delivery.truck_id == Truck.id)
                    .where(
                        and_(
                            Delivery.delivery_date
                            >= func.date_sub(func.now(), text("INTERVAL 30 DAY")),
                            or_(
                                Station.city.like(f"%{from_location}%"),
                                Station.region.like(f"%{from_location}%"),
                                Station.city.like(f"%{to_location}%"),
                                Station.region.like(f"%{to_location}%"),
                            ),
                        )
                    )
                    .order_by(Delivery.delivery_date.desc())
                    .limit(15)
                )
                result = await session.execute(deliveries_stmt)
                deliveries_raw = result.all()
                return [
                    DeliveryData(
                        id=row.id,
                        volume_liters=row.volume_liters,
                        delivery_date=row.delivery_date,
                        status=row.status,
                        station_name=row.station_name,
                        station_code=row.station_code,
                        city=row.city,
                        region=row.region,
                        lat=row.lat,
                        lon=row.lon,
                        truck_code=row.truck_code,
                        truck_plate=row.truck_plate,
                    )
                    for row in deliveries_raw
                ]

            async def get_trucks():
                trucks_stmt = (
                    select(Truck)
                    .where(Truck.status == TRUCK_STATUS_ACTIVE)
                    .order_by(Truck.capacity_liters.desc())
                    .limit(5)
                )
                result = await session.execute(trucks_stmt)
                trucks_orm = result.scalars().all()
                return [
                    TruckData(
                        id=truck.id,
                        code=truck.code,
                        plate=truck.plate,
                        capacity_liters=truck.capacity_liters,
                        fuel_level_percent=truck.fuel_level_percent,
                        fuel_type=truck.fuel_type,
                        status=truck.status,
                    )
                    for truck in trucks_orm
                ]

            # Execute all queries sequentially (SQLAlchemy doesn't allow concurrent operations on same session)
            stations = await get_stations()
            deliveries = await get_deliveries()
            trucks = await get_trucks()

            return DatabaseResult(stations, deliveries, trucks)

        except Exception as e:
            self._logger.exception("SQLAlchemy database query failed")
            raise

    async def _get_weather_data(
        self, from_location: str, to_location: str
    ) -> WeatherResult:
        """Get weather data using standardized models with caching and parallel fetching"""

        try:
            # Check cache first
            cache_key_from = f"weather_{from_location}"
            cache_key_to = f"weather_{to_location}"

            current_time = time.time()
            from_weather = None
            to_weather = None

            # Get cached data if still valid
            if (
                cache_key_from in self._weather_cache
                and current_time - self._weather_cache[cache_key_from]["timestamp"]
                < self._cache_ttl
            ):
                from_weather = self._weather_cache[cache_key_from]["data"]

            if (
                cache_key_to in self._weather_cache
                and current_time - self._weather_cache[cache_key_to]["timestamp"]
                < self._cache_ttl
            ):
                to_weather = self._weather_cache[cache_key_to]["data"]

            # Fetch missing weather data in parallel
            tasks = []
            if from_weather is None:
                tasks.append(("from", get_weather_async(from_location)))
            if to_weather is None:
                tasks.append(("to", get_weather_async(to_location)))

            if tasks:
                results = await asyncio.gather(
                    *[task[1] for task in tasks], return_exceptions=True
                )

                for (location_type, _), result in zip(tasks, results):
                    if isinstance(result, Exception):
                        # Use default weather on error
                        weather_data = WeatherData(
                            "Unknown" if location_type == "from" else to_location,
                            20,
                            "Clear",
                            10,
                            50,
                        )
                    else:
                        weather_data = result

                    # Cache the result
                    cache_key = (
                        cache_key_from if location_type == "from" else cache_key_to
                    )
                    self._weather_cache[cache_key] = {
                        "data": weather_data,
                        "timestamp": current_time,
                    }

                    if location_type == "from":
                        from_weather = weather_data
                    else:
                        to_weather = weather_data

            return WeatherResult(from_weather, to_weather)

        except Exception as e:
            self._logger.exception("Weather data failed")
            # Return empty weather data
            empty_weather = WeatherData("Unknown", 0, "Unknown", 0, 0)
            return WeatherResult(empty_weather, empty_weather)

    async def get_all_stations_sqlalchemy(
        self, session: AsyncSession
    ) -> List[StationData]:
        """Get all stations using SQLAlchemy 2.0 - new method"""
        try:
            stmt = select(Station).order_by(Station.name)
            result = await session.execute(stmt)
            stations_orm = result.scalars().all()
            return convert_stations_list(stations_orm)
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting stations")
            return []
        except Exception as e:
            self._logger.exception("Failed to get stations")
            return []

    async def get_all_trucks_sqlalchemy(self, session: AsyncSession) -> List[TruckData]:
        """Get all trucks using SQLAlchemy 2.0 with driver information"""
        try:
            stmt = (
                select(Truck)
                .options(joinedload(Truck.current_driver))
                .options(joinedload(Truck.deliveries))
                .order_by(Truck.code)
            )
            result = await session.execute(stmt)
            trucks_orm = result.unique().scalars().all()

            trucks = []
            for truck in trucks_orm:
                # Get compartments using SQLAlchemy relationship
                await session.refresh(truck, attribute_names=["compartments"])
                truck_data = convert_truck_orm_to_data(truck)
                trucks.append(truck_data)

            return trucks
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting trucks")
            return []
        except Exception as e:
            self._logger.exception("Failed to get trucks")
            return []

    async def _get_active_trucks_sqlalchemy(
        self, session: AsyncSession
    ) -> List[TruckData]:
        """Get all active trucks using SQLAlchemy 2.0 with driver information"""
        try:
            # Query active trucks with driver relationship loaded
            stmt = (
                select(Truck)
                .options(joinedload(Truck.current_driver))
                .options(joinedload(Truck.deliveries))
                .where(Truck.status == TRUCK_STATUS_ACTIVE)
            )
            result = await session.execute(stmt)
            trucks_orm = result.unique().scalars().all()

            trucks = []
            for truck_orm in trucks_orm:
                # Get compartments
                await session.refresh(truck_orm, attribute_names=["compartments"])
                trucks.append(convert_truck_orm_to_data(truck_orm))

            return trucks
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting active trucks")
            return []
        except Exception as e:
            self._logger.exception("Failed to get active trucks")
            return []

    async def _get_truck_by_id_sqlalchemy(
        self, session: AsyncSession, truck_id: str
    ) -> Optional[TruckData]:
        """Get truck by ID using SQLAlchemy 2.0 with driver information"""
        try:
            self._logger.debug("Looking for truck with identifier: %s", truck_id)

            # Parse various display formats to extract truck code:
            # "T10 (CA-2211)" -> "T10"
            # "T01 (AB-1421) - John Martinez" -> "T01"
            # "TRK-001 (AB-1234) - Driver Name" -> "TRK-001"

            # First, remove anything after " - " (driver name)
            if " - " in truck_id:
                truck_id = truck_id.split(" - ")[0].strip()
                self._logger.debug("Removed driver name suffix, now: %s", truck_id)

            # Then, remove plate number in parentheses
            if " (" in truck_id:
                truck_id = truck_id.split(" (")[0].strip()
                self._logger.debug(
                    "Parsed display format to truck identifier: %s", truck_id
                )

            # Handle different truck ID formats
            if truck_id.startswith("truck-"):
                # Convert "truck-001" format to database ID
                try:
                    numeric_id = int(truck_id.split("-")[1])
                    self._logger.debug(
                        "Converted truck-%03d to ID: %s", numeric_id, numeric_id
                    )
                    stmt = (
                        select(Truck)
                        .options(joinedload(Truck.current_driver))
                        .options(joinedload(Truck.deliveries))
                        .where(Truck.id == numeric_id)
                    )
                except (ValueError, IndexError):
                    self._logger.debug("Invalid truck ID format: %s", truck_id)
                    return None
            else:
                # Look up by code (T01, T02, etc.) or numeric ID
                if truck_id.isdigit():
                    stmt = (
                        select(Truck)
                        .options(joinedload(Truck.current_driver))
                        .options(joinedload(Truck.deliveries))
                        .where(Truck.id == int(truck_id))
                    )
                else:
                    stmt = (
                        select(Truck)
                        .options(joinedload(Truck.current_driver))
                        .options(joinedload(Truck.deliveries))
                        .where(Truck.code == truck_id)
                    )

            result = await session.execute(stmt)
            truck_orm = result.unique().scalar_one_or_none()

            if not truck_orm:
                # Debug: show available trucks
                all_trucks_stmt = select(Truck)
                all_trucks_result = await session.execute(all_trucks_stmt)
                all_trucks = all_trucks_result.scalars().all()
                self._logger.debug(
                    "No truck found. Available trucks: %s",
                    [(t.id, t.code) for t in all_trucks],
                )
                return None

            self._logger.debug(
                "Found truck: ID=%s, code=%s", truck_orm.id, truck_orm.code
            )
            # Get compartments using SQLAlchemy relationship
            await session.refresh(truck_orm, attribute_names=["compartments"])

            return convert_truck_orm_to_data(truck_orm)
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting truck by ID")
            return None
        except Exception as e:
            self._logger.exception("Failed to get truck by ID")
            return None

    async def _get_stations_needing_refuel_sqlalchemy(
        self,
        session: AsyncSession,
        filter_region: Optional[str] = None,
        filter_city: Optional[str] = None,
    ) -> List[StationData]:
        """Get stations that need refueling using SQLAlchemy 2.0 with optional filters"""
        try:
            # Build filter conditions
            filter_conditions = [
                Station.current_level_liters.isnot(None),
                Station.capacity_liters.isnot(None),
                Station.capacity_liters > 0,
                Station.low_fuel_threshold.isnot(None),
                Station.current_level_liters < Station.low_fuel_threshold,
            ]

            # Add regional filters if provided
            if filter_region:
                filter_conditions.append(Station.region == filter_region)
            if filter_city:
                filter_conditions.append(Station.city == filter_city)

            # Calculate fuel percentage and filter for low fuel stations
            stmt = (
                select(Station)
                .where(and_(*filter_conditions))
                .order_by(
                    # Order by urgency - lowest fuel percentage first
                    (Station.current_level_liters / Station.capacity_liters).asc()
                )
            )

            result = await session.execute(stmt)
            stations_orm = result.scalars().all()
            return convert_stations_list(stations_orm)
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting stations needing refuel")
            return []
        except Exception as e:
            self._logger.exception("Failed to get stations needing refuel")
            return []

    async def _call_llm(self, prompt: str, model_id: str) -> str:
        """
        Generic async LLM call via LangChain with multi-provider support and caching
        (OpenAI, Anthropic, or Google Gemini)
        """

        try:
            # Create cache key from prompt and model
            cache_key = hashlib.md5(f"{prompt}_{model_id}".encode()).hexdigest()
            current_time = time.time()

            # Check cache first
            if (
                cache_key in self._llm_cache
                and current_time - self._llm_cache[cache_key]["timestamp"]
                < self._cache_ttl
                and self._llm_cache[cache_key][
                    "data"
                ]  # Ensure cached data is not empty
            ):
                self._logger.debug(
                    "Using cached LLM response for key: %s", cache_key[:8]
                )
                return self._llm_cache[cache_key]["data"]

            # Cache miss - make actual LLM call
            chat = get_chat_model(model_id, temperature=0.2)

            prompt_template = ChatPromptTemplate.from_template("{input}")
            chain = prompt_template | chat | StrOutputParser()

            result = await chain.ainvoke({"input": prompt})

            # Sanitize response
            # Sanitize response using pre-compiled regex
            result = self._script_regex.sub("", result)
            result = result.replace("<", "&lt;").replace(">", "&gt;")
            result = result.strip()

            # Only cache non-empty results
            if result:
                self._llm_cache[cache_key] = {"data": result, "timestamp": current_time}

                # Limit cache size to prevent memory issues
                if len(self._llm_cache) > 100:
                    # Remove oldest entries
                    oldest_keys = sorted(
                        self._llm_cache.keys(),
                        key=lambda k: self._llm_cache[k]["timestamp"],
                    )[
                        :20
                    ]  # Remove 20 oldest
                    for key in oldest_keys:
                        del self._llm_cache[key]

            return result

        except Exception as e:
            self._logger.exception("LLM call failed: %s", e)
            raise Exception(f"LLM call failed: {e}")

    def _parse_comprehensive_response(
        self,
        ai_response: str,
        db_data: DatabaseResult,
        weather_data: WeatherResult,
        departure_time: Optional[str] = None,
        arrival_time: Optional[str] = None,
        time_mode: str = TIME_MODE_DEPARTURE,
    ) -> Dict[str, Any]:
        """Parse AI response using standardized data models"""

        # DEBUG: Print AI response to see what we're getting
        print(f"DEBUG: AI Response (first 500 chars): {ai_response[:500]}")
        print(
            f"DEBUG: AI Response contains 'ROUTE SUMMARY': {'ROUTE SUMMARY' in ai_response}"
        )
        print(
            f"DEBUG: AI Response contains 'TURN-BY-TURN': {'TURN-BY-TURN' in ai_response}"
        )

        # Extract parsed data
        try:
            parsed_directions = self._extract_directions_from_ai(ai_response)
            route_summary = self._extract_route_summary_from_ai(
                ai_response, weather_data.from_location, weather_data.to_location
            )
            traffic_info = self._extract_traffic_info_from_ai(ai_response)
        except Exception as e:
            print(f"Failed to parse AI response: {e}")
            parsed_directions = [{"step": 1, "instruction": "See AI analysis below"}]
            route_summary = {
                "from": weather_data.from_location.city,
                "to": weather_data.to_location.city,
                "ai_generated": True,
            }
            traffic_info = {"note": "Traffic analysis in AI response"}

        # Add time-based information to traffic_info
        if time_mode == TIME_MODE_DEPARTURE and departure_time:
            traffic_info["requested_departure"] = departure_time
        elif time_mode == "arrival" and arrival_time:
            traffic_info["requested_arrival"] = arrival_time

        # Build route summary with defaults
        complete_route_summary = {
            # Core route information
            "from": route_summary.get("from", "Unknown"),
            "to": route_summary.get("to", "Unknown"),
            "total_distance": route_summary.get("total_distance", "AI Generated"),
            "estimated_duration": route_summary.get(
                "estimated_duration", "AI Generated"
            ),
            "duration_with_traffic": route_summary.get(
                "duration_with_traffic", "See AI analysis"
            ),
            # Route details
            "primary_route": route_summary.get("primary_route", "AI Optimized Route"),
            "route_type": route_summary.get("route_type", "AI Optimized"),
            # Timing and conditions
            "best_departure_time": route_summary.get(
                "best_departure_time", "See AI recommendations"
            ),
            "recommended_arrival_time": route_summary.get(
                "recommended_arrival_time", "See AI recommendations"
            ),
            "weather_impact": route_summary.get(
                "weather_impact", f"Current: {weather_data.from_location.condition}"
            ),
            # Fuel planning
            "fuel_stops": route_summary.get("fuel_stops", "See fuel stations section"),
            "estimated_fuel_cost": route_summary.get(
                "estimated_fuel_cost", "Calculated by AI"
            ),
            # Meta information
            "ai_generated": True,
            "optimization_factors": [
                "Real-time weather",
                "Fuel station inventory",
                "Historical delivery data",
            ],
        }

        # Use the centralized response model
        response = RouteOptimizationResponse.from_parsed_data(
            route_summary=complete_route_summary,
            parsed_directions=parsed_directions,
            traffic_info=traffic_info,
            db_data=db_data,
            weather_data=weather_data,
            ai_response=ai_response,
        )

        return response.to_api_dict()

    def _extract_directions_from_ai(self, ai_response: str) -> list:
        """
        Robust parser for turn-by-turn directions from AI response.
        - Flexible heading detection (case-insensitive, with or without ###)
        - Accepts 1., 1), 1 - formats
        - Parses inline and next-line distance/duration info
        """

        directions = []

        try:
            # 1️⃣ Try to isolate a "TURN-BY-TURN DIRECTIONS" section (case-insensitive)
            section_match = re.search(
                r"(?:^|\n)#+\s*TURN[- ]?BY[- ]?TURN DIRECTIONS\s*(.*?)(?:\n#+|\Z)",
                ai_response,
                flags=re.I | re.S,
            )
            text_to_parse = section_match.group(1) if section_match else ai_response

            # 2️⃣ Find numbered steps: 1. / 1) / 1 -
            step_pattern = re.compile(r"^\s*(\d+)[\.\)\-]\s+(.*)$", re.M)
            steps = list(step_pattern.finditer(text_to_parse))

            for idx, match in enumerate(steps, start=1):
                step_no = int(match.group(1))
                instruction = match.group(2).strip()

                # Normalize step number (sometimes LLM restarts numbering)
                if step_no != idx:
                    step_no = idx

                # Defaults
                distance = "N/A"
                duration = "N/A"

                # 3️⃣ Try inline "(12.3 km, 15 min)" format
                paren_match = re.search(r"\(([^)]+)\)", instruction)
                if (
                    paren_match
                    and "km" in paren_match.group(1)
                    and "min" in paren_match.group(1)
                ):
                    parts = [p.strip() for p in paren_match.group(1).split(",")]
                    if len(parts) >= 2:
                        distance, duration = parts[0], parts[1]
                    # Remove the parentheses text from the instruction
                    instruction = re.sub(r"\([^)]+\)", "", instruction).strip()

                # 4️⃣ Try next-line "Distance: ... | Duration: ..." format
                step_end = match.end()
                next_chunk = text_to_parse[step_end:].split("\n", 3)[
                    :3
                ]  # next few lines
                for line in next_chunk:
                    line = line.strip()
                    if "Distance:" in line and "Duration:" in line and "|" in line:
                        parts = [p.strip() for p in line.split("|")]
                        if len(parts) >= 2:
                            distance = parts[0].replace("Distance:", "").strip()
                            duration = parts[1].replace("Duration:", "").strip()
                        break

                # 5️⃣ Detect maneuver type
                maneuver = "straight"
                low_instr = instruction.lower()
                if "left" in low_instr:
                    maneuver = "turn-left"
                elif "right" in low_instr:
                    maneuver = "turn-right"
                elif "merge" in low_instr:
                    maneuver = "merge"
                elif "exit" in low_instr:
                    maneuver = "exit-right"
                elif "arriv" in low_instr:
                    maneuver = "arrive"

                directions.append(
                    {
                        "step": step_no,
                        "instruction": instruction,
                        "distance": distance,
                        "duration": duration,
                        "maneuver": maneuver,
                    }
                )

            # 6️⃣ Fallback: Look for numbered lines in the entire AI response if section is empty
            if not directions:
                fallback_steps = re.findall(
                    r"^\s*(\d+)[\.\)\-]\s+(.*)$", ai_response, flags=re.M
                )
                for idx, (_, instr) in enumerate(fallback_steps, start=1):
                    directions.append(
                        {
                            "step": idx,
                            "instruction": instr.strip(),
                            "distance": "Generated by AI",
                            "duration": "See AI analysis",
                            "maneuver": "straight",
                        }
                    )
                    if idx > 10:  # avoid runaway matches
                        break

            # 7️⃣ Final fallback if nothing was parsed
            if not directions:
                directions = [
                    {
                        "step": 1,
                        "instruction": "Follow AI-generated route (see full analysis below)",
                        "distance": "See AI analysis",
                        "duration": "See AI analysis",
                        "maneuver": "straight",
                    }
                ]

        except Exception as e:
            print(f"Error parsing directions: {e}")
            directions = [
                {
                    "step": 1,
                    "instruction": "AI route analysis available below",
                    "distance": "See full analysis",
                    "duration": "See full analysis",
                    "maneuver": "straight",
                }
            ]

        return directions

    def _extract_route_summary_from_ai(
        self,
        ai_response: str,
        from_weather: WeatherData,
        to_weather: WeatherData,
    ) -> Dict[str, Any]:
        """Extract comprehensive route summary from AI response"""
        summary = {
            "from": from_weather.city,
            "to": to_weather.city,
            "ai_generated": True,
        }

        try:
            # Look for ROUTE SUMMARY section
            summary_section = self._extract_section(ai_response, "ROUTE SUMMARY")

            if summary_section:
                # Define mappings for key-value extraction
                mappings = {
                    "Total Distance:": "total_distance",
                    "Estimated Duration:": "estimated_duration",
                    "Duration with Traffic:": "duration_with_traffic",
                    "Primary Route:": "primary_route",
                    "Route Type:": "route_type",
                    "Weather Impact:": "weather_impact",
                    "Fuel Stops Required:": "fuel_stops",
                    "Estimated Fuel Cost:": "estimated_fuel_cost",
                    "Best Departure Time:": "best_departure_time",
                    "Recommended Arrival Time:": "recommended_arrival_time",
                }

                parsed = self._parse_key_value_lines(summary_section, mappings)
                summary.update(parsed)

        except Exception as e:
            print(f"Error parsing route summary: {e}")

        return summary

    def _extract_traffic_info_from_ai(self, ai_response: str) -> Dict[str, Any]:
        """Extract traffic conditions from AI response"""
        traffic_info = {"ai_analysis": True}

        try:
            # Look for TRAFFIC CONDITIONS section
            traffic_section = self._extract_section(ai_response, "TRAFFIC CONDITIONS")

            if traffic_section:
                mappings = {
                    "Current Traffic:": "current_traffic",
                    "Typical Travel Time:": "typical_time",
                    "Best Departure Time:": "best_departure",
                    "Expected Delays:": "delays",
                }

                parsed = self._parse_key_value_lines(traffic_section, mappings)
                traffic_info.update(parsed)

        except Exception as e:
            print(f"Error parsing traffic info: {e}")

        return traffic_info

    def _create_dispatch_prompt(
        self,
        truck: TruckData,
        stations: List[StationData],
        depot_location: str,
        depot_weather: WeatherData,
    ) -> str:
        """Create a prompt for dispatch optimization using prompt service"""
        return self.prompt_service.format_dispatch_prompt(
            truck=truck,
            stations=stations,
            depot_location=depot_location,
            depot_weather=depot_weather,
        )

    def _parse_dispatch_response(
        self,
        ai_response: str,
        truck: TruckData,
        stations: List[StationData],
        depot_location: str,
    ) -> Dict[str, Any]:
        """Parse the AI response for dispatch optimization"""

        # Extract dispatch summary using helper
        dispatch_summary = {}
        try:
            summary_section = self._extract_section(ai_response, "DISPATCH SUMMARY")

            if summary_section:
                mappings = {
                    "Total Stations to Visit:": "total_stations",
                    "Total Distance:": "total_distance",
                    "Estimated Duration:": "estimated_duration",
                    "Total Fuel to Deliver:": "total_fuel",
                    "Departure Time:": "departure_time",
                    "Return to Depot:": "return_time",
                }

                dispatch_summary = self._parse_key_value_lines(
                    summary_section, mappings
                )
        except Exception as e:
            print(f"Error parsing dispatch summary: {e}")

        # Extract route stops
        route_stops = []
        try:
            route_section = self._extract_section(ai_response, "OPTIMIZED ROUTE")

            if route_section:
                # Parse numbered route items
                lines = route_section.split("\n")
                current_stop = {}

                for line in lines:
                    line = line.strip()
                    if line and line[0].isdigit() and "." in line:
                        # Save previous stop if exists
                        if current_stop:
                            route_stops.append(current_stop)
                        # Start new stop - extract step number for sorting
                        parts = line.split(".", 1)
                        try:
                            step_number = int(parts[0].strip())
                            station_info = self._clean_markdown(parts[1].strip())
                            current_stop = {
                                "step_number": step_number,
                                "station": station_info,
                            }
                        except (ValueError, IndexError):
                            # Fallback if step number parsing fails
                            station_info = self._clean_markdown(
                                line.split(".", 1)[1].strip()
                            )
                            current_stop = {"station": station_info}
                    elif "Distance from previous:" in line:
                        current_stop["distance"] = self._clean_markdown(
                            line.split(":", 1)[-1].strip()
                        )
                    elif "Fuel to deliver:" in line:
                        current_stop["fuel_delivery"] = self._clean_markdown(
                            line.split(":", 1)[-1].strip()
                        )
                    elif "ETA:" in line:
                        current_stop["eta"] = self._clean_markdown(
                            line.split(":", 1)[-1].strip()
                        )
                    elif "Reason:" in line:
                        current_stop["reason"] = self._clean_markdown(
                            line.split(":", 1)[-1].strip()
                        )

                # Add last stop
                if current_stop:
                    route_stops.append(current_stop)

                # Sort stops by step_number to ensure correct order
                route_stops.sort(key=lambda x: x.get("step_number", float("inf")))

                # Extract station codes and clean up route stops
                # Also match station names to actual station codes from the stations list
                station_lookup = {}
                for station in stations:
                    # Create lookup by name and code
                    station_lookup[station.name.lower()] = station.code
                    station_lookup[station.code.lower()] = station.code
                    # Also match "name (code)" format
                    full_name = f"{station.name} ({station.code})".lower()
                    station_lookup[full_name] = station.code

                for stop in route_stops:
                    stop.pop("step_number", None)

                    # Extract station code from station name (format: "Station Name (CODE)")
                    station_text = stop.get("station", "")
                    station_code = None

                    if "(" in station_text and ")" in station_text:
                        # Extract code from parentheses
                        start_idx = station_text.rfind("(")
                        end_idx = station_text.rfind(")")
                        if start_idx < end_idx:
                            station_code = station_text[start_idx + 1 : end_idx].strip()
                            # Also extract clean station name without code
                            stop["station_name"] = station_text[:start_idx].strip()

                    # If no code found in parentheses, try to match from station list
                    if not station_code:
                        station_code = station_lookup.get(station_text.lower())

                    if station_code:
                        stop["station_code"] = station_code
                    else:
                        # Log warning if we couldn't find a station code
                        self._logger.warning(
                            "Could not extract station code from: %s", station_text
                        )
        except Exception:
            self._logger.exception("Error parsing route stops")

        return {
            "dispatch_summary": dispatch_summary,
            "truck": truck_simple_dict(truck),
            "depot_location": depot_location,
            "route_stops": route_stops,
            "stations_available": [station_available_dict(s) for s in stations],
            "ai_analysis": ai_response,
        }

    def _create_batch_dispatch_prompt(
        self,
        trucks: List[TruckData],
        stations: List[StationData],
        depot_location: str,
        depot_weather: WeatherData,
        max_recommendations: int,
    ) -> str:
        """Create a prompt for batch dispatch recommendations"""
        return self.prompt_service.format_batch_dispatch_prompt(
            trucks=trucks,
            stations=stations,
            depot_location=depot_location,
            depot_weather=depot_weather,
            max_recommendations=max_recommendations,
        )

    def _parse_batch_dispatch_response(
        self,
        ai_response: str,
        trucks: List[TruckData],
        stations: List[StationData],
        depot_location: str,
    ) -> Dict[str, Any]:
        """Parse AI response for batch dispatch recommendations"""
        recommendations = []

        print(f"\n{'='*80}")
        print(f"DISPATCH PARSING DEBUG")
        print(f"{'='*80}")
        print(f"AI Response Length: {len(ai_response)}")
        print(f"AI Response Preview (first 1000 chars):\n{ai_response[:1000]}")
        print(f"{'='*80}\n")

        self._logger.debug(
            f"Parsing batch dispatch response, AI response length: {len(ai_response)}"
        )
        self._logger.debug(
            f"AI response preview (first 500 chars): {ai_response[:500]}"
        )

        try:
            # Extract recommendations section
            recs_section = self._extract_section(
                ai_response, "DISPATCH RECOMMENDATIONS"
            )

            print(
                f"Extracted section length: {len(recs_section) if recs_section else 0}"
            )
            print(
                f"Section preview: {recs_section[:500] if recs_section else 'NONE FOUND'}\n"
            )

            self._logger.debug(
                f"Extracted recommendations section length: {len(recs_section) if recs_section else 0}"
            )
            self._logger.debug(
                f"Recommendations section preview: {recs_section[:300] if recs_section else 'NONE'}"
            )

            if recs_section:
                # Parse each recommendation block (starts with **Recommendation X:**)
                rec_blocks = recs_section.split("**Recommendation ")
                self._logger.debug(f"Split into {len(rec_blocks)} blocks")

                for block in rec_blocks[1:]:  # Skip the first empty part
                    if not block.strip():
                        continue

                    rec = {}
                    lines = block.strip().split("\n")
                    self._logger.debug(
                        f"Processing block with {len(lines)} lines, first line: {lines[0] if lines else 'EMPTY'}"
                    )

                    # Extract recommendation number
                    if lines and lines[0].strip().endswith(":**"):
                        rec["recommendation_number"] = (
                            lines[0].strip().replace(":**", "")
                        )

                    # Parse the rest of the fields
                    for line in lines[1:]:
                        line = line.strip()
                        if line.startswith("Truck:"):
                            rec["truck_code"] = line.replace("Truck:", "").strip()
                        elif line.startswith("Priority:"):
                            rec["priority"] = line.replace("Priority:", "").strip()
                        elif line.startswith("Stations:"):
                            rec["station_count"] = line.replace("Stations:", "").strip()
                        elif line.startswith("Route:"):
                            rec["route_summary"] = line.replace("Route:", "").strip()
                        elif line.startswith("Total Distance:"):
                            rec["total_distance"] = line.replace(
                                "Total Distance:", ""
                            ).strip()
                        elif line.startswith("Estimated Duration:"):
                            rec["estimated_duration"] = line.replace(
                                "Estimated Duration:", ""
                            ).strip()
                        elif line.startswith("Total Fuel Delivery:"):
                            rec["total_fuel_delivery"] = line.replace(
                                "Total Fuel Delivery:", ""
                            ).strip()
                        elif line.startswith("Rationale:"):
                            rec["rationale"] = line.replace("Rationale:", "").strip()

                    if rec.get("truck_code"):
                        recommendations.append(rec)
                        self._logger.debug(
                            f"Added recommendation for truck: {rec.get('truck_code')}"
                        )
                    else:
                        self._logger.warning(
                            f"Skipped recommendation block without truck_code"
                        )

        except Exception:
            self._logger.exception("Error parsing batch dispatch recommendations")

        self._logger.info(
            f"Parsed {len(recommendations)} recommendations from AI response"
        )

        # Extract summary
        summary = ""
        try:
            summary_section = self._extract_section(ai_response, "EXECUTIVE SUMMARY")
            if summary_section:
                summary = summary_section.strip()
        except Exception:
            pass

        return {
            "recommendations": recommendations,
            "summary": summary or ai_response[:500],  # Fallback to first 500 chars
            "total_trucks": len(trucks),
            "total_stations": len(stations),
            "ai_analysis": ai_response,
        }
