/**
 * Data transformation utilities
 * Handles conversion between backend API format and frontend data structures
 * @module services/transformers
 */

/**
 * Extract direction type from instruction text (fallback for APIs that don't provide it)
 * @param {string} instruction - The instruction text
 * @returns {string} Direction type
 */
export function extractDirectionType(instruction) {
  const text = instruction.toLowerCase();

  if (text.includes("destination") || text.includes("arrive"))
    return "destination";
  if (text.includes("turn right") || text.includes("right onto"))
    return "turn_right";
  if (text.includes("turn left") || text.includes("left onto"))
    return "turn_left";
  if (text.includes("u-turn"))
    return text.includes("left") ? "uturn_left" : "uturn_right";
  if (text.includes("exit") && text.includes("right")) return "exit_right";
  if (text.includes("exit") && text.includes("left")) return "exit_left";
  if (text.includes("merge"))
    return text.includes("left") ? "merge_left" : "merge_right";
  if (text.includes("roundabout")) return "roundabout";
  if (text.includes("continue") || text.includes("straight")) return "straight";
  if (text.includes("head")) return "straight";

  return "straight";
}

/**
 * Transform API route response to standardized frontend format.
 *
 * This is the single transformation layer between backend API and frontend.
 * If backend data structure changes, update this method accordingly.
 *
 * @param {import('./types').RouteOptimizationResponse} apiData - Raw API response
 * @returns {import('./types').TransformedRouteData} Standardized route data for frontend
 */
export function transformRouteResponse(apiData) {
  const routeSummary = apiData.route_summary || {};
  const directions = apiData.directions || [];
  const weatherImpact = apiData.weather_impact || {};
  const trafficConditions = apiData.traffic_conditions || {};
  const fuelStations = apiData.fuel_stations || [];
  const recentDeliveries = apiData.recent_deliveries || [];
  const availableTrucks = apiData.available_trucks || [];
  const aiAnalysis = apiData.ai_analysis || "";
  const dataSources = apiData.data_sources || {};

  return {
    eta: {
      duration: routeSummary.estimated_duration || "N/A",
      distance: routeSummary.total_distance || "N/A",
      recommendedArrival: routeSummary.recommended_arrival_time || null,
      recommendedDeparture: routeSummary.best_departure_time || null,
    },
    instructions: directions.map((step, index) => ({
      id: step.step_id || step.step || index + 1,
      text: step.instruction || step.text || "Continue on route",
      distance: step.distance || "N/A",
      direction_type:
        step.direction_type || extractDirectionType(step.instruction || ""),
      compass_direction: step.compass_direction || step.bearing || null,
    })),
    routeSummary: {
      from: routeSummary.from || "N/A",
      to: routeSummary.to || "N/A",
      primaryRoute: routeSummary.primary_route || "N/A",
      routeType: routeSummary.route_type || "N/A",
      bestDepartureTime: routeSummary.best_departure_time || "N/A",
      recommendedArrivalTime: routeSummary.recommended_arrival_time || "N/A",
      weatherImpact: routeSummary.weather_impact || "N/A",
      fuelStops: routeSummary.fuel_stops || "N/A",
      estimatedFuelCost: routeSummary.estimated_fuel_cost || "N/A",
      optimizationFactors: routeSummary.optimization_factors || [],
    },
    weatherImpact: {
      fromLocation: weatherImpact.from_location || {},
      toLocation: weatherImpact.to_location || {},
      routeImpact: weatherImpact.route_impact || "N/A",
      drivingConditions: weatherImpact.driving_conditions || "N/A",
    },
    trafficConditions: trafficConditions,
    fuelStations: fuelStations,
    recentDeliveries: recentDeliveries,
    availableTrucks: availableTrucks,
    aiAnalysis: aiAnalysis,
    dataSources: dataSources,
  };
}

/**
 * Transform dispatch optimization API response to standardized format.
 * Ensures all backend data is properly consumed by the frontend.
 *
 * @param {Object} apiData - Raw dispatch API response
 * @returns {Object} Standardized dispatch data
 */
export function transformDispatchResponse(apiData) {
  // The backend returns dispatch_summary, route_stops, truck, stations_available, and ai_analysis
  // This function ensures the data structure is properly consumed by the frontend
  const {
    dispatch_summary = {},
    route_stops = [],
    truck = {},
    stations_available = [],
    depot_location = "",
    ai_analysis = "",
    ...otherFields
  } = apiData;

  // Return the data in the structure expected by DispatchResultCard
  return {
    dispatch_summary,
    route_stops,
    truck,
    stations_available,
    depot_location,
    ai_analysis,
    // Include any additional fields that might be added by backend
    ...otherFields,
  };
}
