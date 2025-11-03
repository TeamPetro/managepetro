/**
 * Type definitions for API data structures
 * Centralizes all JSDoc typedefs used across the application
 * @module services/types
 */

/**
 * @typedef {Error & { status?: number, data?: any }} ApiError
 */

/**
 * @typedef {Object} Truck
 * @property {string} truck_id
 * @property {string} [plate_number]
 * @property {number} [capacity_liters]
 */

/**
 * @typedef {Object} Station
 * @property {string} station_id
 * @property {string} [name]
 * @property {string} [city]
 */

/**
 * @typedef {Object} Trip
 * @property {string} trip_id
 * @property {boolean} [delivery_successful]
 */

/**
 * @typedef {Object} RouteOptimizationResponse
 * @property {Object} route_summary - Summary of the route
 * @property {Array} directions - Turn-by-turn directions
 * @property {Object} weather_impact - Weather impact on the route
 * @property {Object} traffic_conditions - Traffic conditions along the route
 * @property {Array} fuel_stations - Available fuel stations
 * @property {Array} recent_deliveries - Recent deliveries in the area
 * @property {Array} available_trucks - Available trucks for assignment
 * @property {Object} data_sources - Data source information
 * @property {string} ai_analysis - AI-generated analysis
 */

/**
 * @typedef {Object} TransformedRouteData
 * @property {Object} eta - ETA information
 * @property {Array} instructions - Transformed instructions
 * @property {Object} routeSummary - Route summary
 * @property {Object} weatherImpact - Weather impact
 * @property {Object} trafficConditions - Traffic conditions
 * @property {Array} fuelStations - Fuel stations
 * @property {Array} recentDeliveries - Recent deliveries
 * @property {Array} availableTrucks - Available trucks
 * @property {string} aiAnalysis - AI analysis
 * @property {Object} dataSources - Data sources
 */

/**
 * @typedef {Object} DispatchOptimizationResponse
 * @property {Object} dispatch_summary - Summary of the dispatch
 * @property {Array} route_stops - Route stops for the dispatch
 * @property {Object} truck - Assigned truck information
 * @property {Array} stations_available - Available stations
 * @property {string} depot_location - Depot location
 * @property {string} ai_analysis - AI analysis of the dispatch
 */
