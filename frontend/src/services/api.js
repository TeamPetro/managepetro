/**
 * Main API facade
 * Imports and re-exports all API services for backward compatibility
 * @module services/api
 */

// Re-export HTTP client for direct access if needed
export { httpClient, rawAxios } from "./http-client";

// Re-export all type definitions
export * from "./types";

// Re-export all transformers
export * from "./transformers";

// Re-export domain-specific API services
export * from "./trucks-api";
export * from "./stations-api";
export * from "./trips-api";
export * from "./routes-api";
export * from "./dispatch-api";
export * from "./weather-api";
export * from "./auth-api";

// Legacy API object for backward compatibility
// This maintains the existing Api object structure while using the new modular services
import { httpClient } from "./http-client";
import {
  transformRouteResponse,
  transformDispatchResponse,
} from "./transformers";
import { optimizeRouteWithTransform } from "./routes-api";
import { login, register, me, logout } from "./auth-api";
import { getTrucks, getTruck, createTruck } from "./trucks-api";
import { getStations, getStation } from "./stations-api";
import { getTrips, getTrip } from "./trips-api";
import { getWeather } from "./weather-api";

const Api = {
  // HTTP methods
  get: httpClient.get,
  post: httpClient.post,
  put: httpClient.put,
  patch: httpClient.patch,
  delete: httpClient.delete,

  // Health check
  health: () => httpClient.get("/health"),

  // Trucks
  getTrucks,
  getTruck,
  createTruck,

  // Stations
  getStations,
  getStation,

  // Trips
  getTrips,
  getTrip,

  // Routes
  optimizeRoute: optimizeRouteWithTransform, // Use transformed version for backward compatibility
  tomtom: (routeData) => httpClient.post("/routes/tomtom", routeData),
  reachableRange: (rangeData) =>
    httpClient.post("/routes/reachable-range", rangeData),

  // Dispatch
  optimizeDispatch: (dispatchData) =>
    httpClient.post("/dispatch/optimize", dispatchData),

  // Weather
  weather: getWeather,

  // Auth
  login,
  register,
  me,
  logout,

  // Transformers (for backward compatibility)
  transformRouteResponse,
  transformDispatchResponse,
};

export default Api;
