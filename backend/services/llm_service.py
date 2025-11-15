# from google import genai
# from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.exc import SQLAlchemyError
from .prompt_service import PromptService
from .api_utils import get_weather_async
from config import config
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
import re
from utils.serializers import station_available_dict, truck_simple_dict
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .lc_router import get_chat_model
import os 


class LLMService:
    def __init__(self):
        self.prompt_service = PromptService()
        self._logger = logging.getLogger(__name__)

    def _extract_section(self, ai_response: str, section_name: str) -> str:
        """
        Helper method to extract a section from AI response
        Returns the content between section_name and next ### marker
        """
        if section_name not in ai_response:
            return ""

        section_content = ai_response.split(section_name)[1]
        if "###" in section_content:
            section_content = section_content.split("###")[0]

        return section_content.strip()

    def _clean_markdown(self, text: str) -> str:
        """
        Remove markdown formatting from text.
        Removes bold (**), italic (*), and other common markdown syntax.
        """
        if not text:
            return text

        import re

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

    def _parse_key_value_lines(self, text: str, mappings: dict) -> dict:
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
    # Default model is Gemini 2.5 Flash; override by passing llm_model in API request (e.g., 'openai:gpt-4o', 'anthropic:claude-3-sonnet')
    llm_model: str = os.getenv("DEFAULT_LLM_MODEL", "models/gemini-2.5-flash"),
    departure_time: Optional[str] = None,
    arrival_time: Optional[str] = None,
    time_mode: str = "departure",
    delivery_date: Optional[str] = None,
    vehicle_type: str = "fuel_delivery_truck",
    notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate route optimization using standardized data models with SQLAlchemy 2.0"""

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

        ai_response = await self._call_llm(comprehensive_prompt, llm_model)
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
    # Default model is Gemini 2.5 Flash; override by passing llm_model in API request (e.g., 'openai:gpt-4o', 'anthropic:claude-3-sonnet')
    llm_model: str = os.getenv("DEFAULT_LLM_MODEL", "models/gemini-2.5-flash"),
    ) -> Dict[str, Any]:
        """Optimize dispatch route for a truck to deliver fuel to stations in need using SQLAlchemy 2.0"""
        try:
            # Get truck details using SQLAlchemy
            truck = await self._get_truck_by_id_sqlalchemy(session, truck_id)
            if not truck:
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

            # Get AI optimization
            ai_response = await self._call_llm(prompt, llm_model)
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

    async def _get_database_data_sqlalchemy(
        self, session: AsyncSession, from_location: str, to_location: str
    ) -> DatabaseResult:
        """Query database using SQLAlchemy 2.0 and return standardized data models"""
        try:
            # Get stations with fuel above minimum threshold
            stations_stmt = (
                select(Station)
                .where(Station.current_level_liters > 1000)
                .order_by(Station.capacity_liters.desc())
                .limit(10)
            )
            stations_result = await session.execute(stations_stmt)
            stations_orm = stations_result.scalars().all()
            stations = [
                StationData(
                    id=station.id,
                    code=station.code,
                    name=station.name,
                    lat=station.lat,
                    lon=station.lon,
                    city=station.city,
                    region=station.region,
                    fuel_type=station.fuel_type,
                    capacity_liters=station.capacity_liters,
                    current_level_liters=station.current_level_liters,
                )
                for station in stations_orm
            ]

            # Get recent deliveries with location filtering
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
            deliveries_result = await session.execute(deliveries_stmt)
            deliveries_raw = deliveries_result.all()
            deliveries = [
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

            # Get active trucks
            trucks_stmt = (
                select(Truck)
                .where(Truck.status == "active")
                .order_by(Truck.capacity_liters.desc())
                .limit(5)
            )
            trucks_result = await session.execute(trucks_stmt)
            trucks_orm = trucks_result.scalars().all()
            trucks = [
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

            return DatabaseResult(stations, deliveries, trucks)

        except Exception as e:
            self._logger.exception("SQLAlchemy database query failed")
            raise

    async def _get_weather_data(
        self, from_location: str, to_location: str
    ) -> WeatherResult:
        """Get weather data using standardized models (async)"""
        try:
            from_weather = await get_weather_async(from_location)
            to_weather = await get_weather_async(to_location)
            return WeatherResult(from_weather, to_weather)
        except Exception as e:
            self._logger.exception("Weather data failed")
            # Return empty weather data
            empty_weather = WeatherData("Unknown", 0, "Unknown", 0, 0)
            return WeatherResult(empty_weather, empty_weather)

    async def get_all_stations_sqlalchemy(
        self, session: AsyncSession
    ) -> list[StationData]:
        """Get all stations using SQLAlchemy 2.0 - new method"""
        try:
            stmt = select(Station).order_by(Station.name)
            result = await session.execute(stmt)
            stations_orm = result.scalars().all()

            # Convert SQLAlchemy models to data models
            stations = []
            for station in stations_orm:
                station_data = StationData(
                    id=station.id,
                    code=station.code,
                    name=station.name,
                    lat=float(station.lat) if station.lat else None,
                    lon=float(station.lon) if station.lon else None,
                    city=station.city,
                    region=station.region,
                    fuel_type=station.fuel_type,
                    capacity_liters=(
                        float(station.capacity_liters)
                        if station.capacity_liters
                        else None
                    ),
                    current_level_liters=(
                        float(station.current_level_liters)
                        if station.current_level_liters
                        else None
                    ),
                    request_method=station.request_method,
                    low_fuel_threshold=(
                        float(station.low_fuel_threshold)
                        if station.low_fuel_threshold
                        else None
                    ),
                )
                stations.append(station_data)

            return stations
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting stations")
            return []
        except Exception as e:
            self._logger.exception("Failed to get stations")
            return []

    async def get_all_trucks_sqlalchemy(self, session: AsyncSession) -> list[TruckData]:
        """Get all trucks using SQLAlchemy 2.0 - new method"""
        try:
            stmt = select(Truck).order_by(Truck.code)
            result = await session.execute(stmt)
            trucks_orm = result.scalars().all()

            trucks = []
            for truck in trucks_orm:
                # Get compartments using SQLAlchemy relationship
                await session.refresh(truck, attribute_names=["compartments"])

                compartments = []
                for comp in truck.compartments:
                    compartments.append(
                        {
                            "compartment_number": comp.compartment_number,
                            "fuel_type": comp.fuel_type,
                            "capacity_liters": float(comp.capacity_liters),
                            "current_level_liters": float(comp.current_level_liters),
                        }
                    )

                truck_data = TruckData(
                    id=truck.id,
                    code=truck.code,
                    plate=truck.plate,
                    capacity_liters=(
                        float(truck.capacity_liters) if truck.capacity_liters else None
                    ),
                    fuel_level_percent=truck.fuel_level_percent,
                    fuel_type=truck.fuel_type,
                    status=truck.status,
                    compartments=compartments,
                )
                trucks.append(truck_data)

            return trucks
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting trucks")
            return []
        except Exception as e:
            self._logger.exception("Failed to get trucks")
            return []

    async def _get_truck_by_id_sqlalchemy(
        self, session: AsyncSession, truck_id: str
    ) -> Optional[TruckData]:
        """Get truck by ID using SQLAlchemy 2.0"""
        try:
            self._logger.debug("Looking for truck with identifier: %s", truck_id)

            # Handle different truck ID formats
            if truck_id.startswith("truck-"):
                # Convert "truck-001" format to database ID
                try:
                    numeric_id = int(truck_id.split("-")[1])
                    self._logger.debug(
                        "Converted truck-%03d to ID: %s", numeric_id, numeric_id
                    )
                    stmt = select(Truck).where(Truck.id == numeric_id)
                except (ValueError, IndexError):
                    self._logger.debug("Invalid truck ID format: %s", truck_id)
                    return None
            else:
                # Look up by code (T01, T02, etc.) or numeric ID
                if truck_id.isdigit():
                    stmt = select(Truck).where(Truck.id == int(truck_id))
                else:
                    stmt = select(Truck).where(Truck.code == truck_id)

            result = await session.execute(stmt)
            truck_orm = result.scalar_one_or_none()

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

            compartments = []
            for comp in truck_orm.compartments:
                compartments.append(
                    {
                        "compartment_number": comp.compartment_number,
                        "fuel_type": comp.fuel_type,
                        "capacity_liters": float(comp.capacity_liters),
                        "current_level_liters": float(comp.current_level_liters),
                    }
                )

            return TruckData(
                id=truck_orm.id,
                code=truck_orm.code,
                plate=truck_orm.plate,
                capacity_liters=(
                    float(truck_orm.capacity_liters)
                    if truck_orm.capacity_liters
                    else None
                ),
                fuel_level_percent=truck_orm.fuel_level_percent,
                fuel_type=truck_orm.fuel_type,
                status=truck_orm.status,
                compartments=compartments,
            )
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting truck by ID")
            return None
        except Exception as e:
            self._logger.exception("Failed to get truck by ID")
            return None

    async def _get_stations_needing_refuel_sqlalchemy(
        self, session: AsyncSession
    ) -> List[StationData]:
        """Get stations that need refueling using SQLAlchemy 2.0"""
        try:
            # Calculate fuel percentage and filter for low fuel stations
            stmt = (
                select(Station)
                .where(
                    and_(
                        Station.current_level_liters.isnot(None),
                        Station.capacity_liters.isnot(None),
                        Station.capacity_liters > 0,
                        Station.low_fuel_threshold.isnot(None),
                        Station.current_level_liters < Station.low_fuel_threshold,
                    )
                )
                .order_by(
                    # Order by urgency - lowest fuel percentage first
                    (Station.current_level_liters / Station.capacity_liters).asc()
                )
            )

            result = await session.execute(stmt)
            stations_orm = result.scalars().all()

            stations = []
            for station in stations_orm:
                station_data = StationData(
                    id=station.id,
                    code=station.code,
                    name=station.name,
                    lat=station.lat,
                    lon=station.lon,
                    city=station.city,
                    region=station.region,
                    fuel_type=station.fuel_type,
                    capacity_liters=station.capacity_liters,
                    current_level_liters=station.current_level_liters,
                    request_method=station.request_method,
                    low_fuel_threshold=station.low_fuel_threshold,
                    needs_refuel=station.current_level_liters
                    < station.low_fuel_threshold,
                )
                stations.append(station_data)

            return stations
        except SQLAlchemyError as e:
            self._logger.exception("SQLAlchemy error getting stations needing refuel")
            return []
        except Exception as e:
            self._logger.exception("Failed to get stations needing refuel")
            return []

    async def _call_gemini(self, prompt: str, model: str) -> str:
        """Make the actual Gemini API call with proper error handling"""
        try:
            # Note: wrap the SDK call in a try/except; we will normalize output
            # to a string below and sanitize it before returning.
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=3000,
                ),
            )

            # Normalize response into a plain string so downstream code and the
            # frontend always receive a consistent `ai_analysis` field.
            ai_text = ""

            # Preferred attribute used in existing code
            if response is None:
                ai_text = ""
            elif hasattr(response, "text"):
                # Some client versions provide `text` as the generated content
                ai_text = response.text or ""
            else:
                # Fallbacks: try common container shapes then str()
                try:
                    # Some SDKs return `outputs` or `output` lists
                    if hasattr(response, "outputs"):
                        parts = []
                        for out in getattr(response, "outputs"):
                            if hasattr(out, "text"):
                                parts.append(out.text)
                            elif isinstance(out, str):
                                parts.append(out)
                        ai_text = "\n".join(parts)
                    elif hasattr(response, "output"):
                        parts = []
                        for out in getattr(response, "output"):
                            # nested shapes
                            if isinstance(out, dict):
                                # try common keys
                                for key in ("content", "text", "message"):
                                    if key in out:
                                        parts.append(str(out[key]))
                            elif isinstance(out, str):
                                parts.append(out)
                        ai_text = "\n".join(parts)
                    else:
                        ai_text = str(response)
                except Exception:
                    # Last resort: stringify the whole response
                    ai_text = str(response)

            # Log basic diagnostics
            try:
                self._logger.debug(
                    "Gemini response normalized type=%s length=%s",
                    type(ai_text),
                    len(ai_text),
                )
            except Exception:
                self._logger.exception("Gemini response normalized repr logging failed")

            # Sanitize AI text to reduce risk of script injection or accidental
            # HTML being interpreted by clients. We remove script tags and
            # then escape angle brackets. Frontend should still render as text.
            try:
                # Remove <script>...</script> blocks (case-insensitive)
                ai_text = re.sub(
                    r"(?i)<script.*?>.*?</script>", "", ai_text, flags=re.DOTALL
                )
                # Escape angle brackets to prevent any accidental HTML rendering
                ai_text = ai_text.replace("<", "&lt;").replace(">", "&gt;")
            except Exception:
                # If sanitization fails, log and return the raw text as a fallback
                self._logger.exception("Failed to sanitize ai_text")

            return ai_text

        except Exception as e:
            error_msg = str(e)
            if (
                "quota" in error_msg.lower()
                or "resource_exhausted" in error_msg.lower()
            ):
                self._logger.exception("API quota exceeded: %s", e)
                raise Exception(
                    "API quota exceeded. Please check your API limits or wait before retrying."
                )
            elif "not_found" in error_msg.lower():
                self._logger.exception("model not found: %s", e)
                raise Exception(
                    f"Model '{model}' not found. Please check if the model name is correct."
                )
            else:
                self._logger.exception("API call failed: %s", e)
                raise
    async def _call_llm(self, prompt: str, model_id: str) -> str:
        """
        Generic async LLM call via LangChain with multi-provider support
        (OpenAI, Anthropic, or Google Gemini)
        """
        try:
            chat = get_chat_model(model_id, temperature=0.2)

            prompt_template = ChatPromptTemplate.from_template("{input}")
            chain = prompt_template | chat | StrOutputParser()

            result = await chain.ainvoke({"input": prompt})

            # Sanitize basic HTML/Markdown
            import re
            result = re.sub(r"(?i)<script.*?>.*?</script>", "", result, flags=re.DOTALL)
            result = result.replace("<", "&lt;").replace(">", "&gt;")

            return result.strip()
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
        time_mode: str = "departure",
    ) -> Dict[str, Any]:
        """Parse AI response using standardized data models"""

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
        if time_mode == "departure" and departure_time:
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

        import re
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
                if paren_match and "km" in paren_match.group(1) and "min" in paren_match.group(1):
                    parts = [p.strip() for p in paren_match.group(1).split(",")]
                    if len(parts) >= 2:
                        distance, duration = parts[0], parts[1]
                    # Remove the parentheses text from the instruction
                    instruction = re.sub(r"\([^)]+\)", "", instruction).strip()

                # 4️⃣ Try next-line "Distance: ... | Duration: ..." format
                step_end = match.end()
                next_chunk = text_to_parse[step_end:].split("\n", 3)[:3]  # next few lines
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
                fallback_steps = re.findall(r"^\s*(\d+)[\.\)\-]\s+(.*)$", ai_response, flags=re.M)
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
    ) -> dict:
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

    def _extract_traffic_info_from_ai(self, ai_response: str) -> dict:
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

                # Remove step_number from the output as it's only used for sorting
                for stop in route_stops:
                    stop.pop("step_number", None)
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
