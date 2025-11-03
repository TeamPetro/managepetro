/**
 * Example: Using Auto-Generated Types
 *
 * This file demonstrates how to use types generated from the backend API.
 * Run `npm run generate-types` first to populate src/types/api.ts
 */

// ============================================================================
// 1. IMPORTING TYPES AND CONSTANTS
// ============================================================================

/**
 * Import types from the generated api.ts file
 * @typedef {import('../types/api').RouteRequest} RouteRequest
 * @typedef {import('../types/api').RouteResponse} RouteResponse
 * @typedef {import('../types/api').DispatchRequest} DispatchRequest
 * @typedef {import('../types/api').DispatchResponse} DispatchResponse
 * @typedef {import('../types/api').TruckModel} TruckModel
 * @typedef {import('../types/api').StationModel} StationModel
 */

import { httpClient } from "../services/api.js";
import {
  DEFAULT_LLM_MODEL,
  TRUCK_STATUS,
  TIME_MODES,
} from "../constants/config.js";

// ============================================================================
// 2. USING TYPES IN FUNCTIONS
// ============================================================================

/**
 * Example: Function with typed parameters and return value
 *
 * @param {RouteRequest} request - Route optimization request
 * @returns {Promise<RouteResponse>} - Route optimization response
 */
export async function calculateOptimalRoute(request) {
  // VS Code will provide autocomplete for 'request' fields
  // and warn if required fields are missing
  const response = await httpClient.post("/api/routes/optimize", request);

  // VS Code knows the shape of 'response' and provides autocomplete
  return response;
}

/**
 * Example: Function with typed object destructuring
 *
 * @param {Object} params
 * @param {string} params.origin - Starting location
 * @param {string} params.destination - Ending location
 * @param {number} params.truckId - Truck ID
 * @param {string} [params.llmModel] - Optional LLM model
 * @returns {Promise<RouteResponse>}
 */
export async function quickRoute({ origin, destination, truckId, llmModel }) {
  /** @type {RouteRequest} */
  const request = {
    from_location: origin,
    to_location: destination,
    truck_id: truckId,
    llm_model: llmModel || DEFAULT_LLM_MODEL,
    use_ai_optimization: true,
  };

  return calculateOptimalRoute(request);
}

// ============================================================================
// 3. TYPE VALIDATION IN REACT COMPONENTS
// ============================================================================

/**
 * Example: React component with typed props
 *
 * @param {Object} props
 * @param {RouteResponse} props.routeData - Route data from API
 * @param {() => void} props.onRefresh - Refresh callback
 */
export function RouteDisplay({ routeData, onRefresh }) {
  return (
    <div>
      <h2>Route Details</h2>
      {/* VS Code autocompletes routeData fields */}
      <p>Distance: {routeData.distance} km</p>
      <p>Duration: {routeData.duration} minutes</p>
      <p>Fuel Cost: ${routeData.fuel_cost}</p>

      {/* Type checking catches typos */}
      {/* <p>Cost: {routeData.cst}</p> */}
      {/* ❌ VS Code shows error: Property 'cst' does not exist */}

      <button onClick={onRefresh}>Refresh Route</button>
    </div>
  );
}

// ============================================================================
// 4. REACT QUERY WITH TYPES
// ============================================================================

import { useQuery, useMutation } from "@tanstack/react-query";

/**
 * Example: React Query hook with typed response
 *
 * @param {number} truckId
 * @returns {import('@tanstack/react-query').UseQueryResult<TruckModel>}
 */
export function useTruck(truckId) {
  return useQuery({
    queryKey: ["truck", truckId],
    queryFn: async () => {
      /** @type {TruckModel} */
      const truck = await httpClient.get(`/api/trucks/${truckId}`);
      return truck;
    },
    enabled: Boolean(truckId),
  });
}

/**
 * Example: React Query mutation with typed input/output
 *
 * @returns {import('@tanstack/react-query').UseMutationResult<RouteResponse, Error, RouteRequest>}
 */
export function useOptimizeRoute() {
  return useMutation({
    mutationFn: async (/** @type {RouteRequest} */ request) => {
      return calculateOptimalRoute(request);
    },
    onSuccess: (data) => {
      // 'data' is typed as RouteResponse
      console.log("Route optimized:", data.distance);
    },
    onError: (error) => {
      console.error("Optimization failed:", error.message);
    },
  });
}

// ============================================================================
// 5. TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

/**
 * Type guard to check if data is a valid RouteResponse
 *
 * @param {any} data
 * @returns {data is RouteResponse}
 */
export function isRouteResponse(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.distance === "number" &&
    typeof data.duration === "number" &&
    Array.isArray(data.instructions)
  );
}

/**
 * Example: Using type guard for safe data access
 *
 * @param {any} apiResponse - Untyped API response
 */
export function safelyProcessRoute(apiResponse) {
  if (isRouteResponse(apiResponse)) {
    // TypeScript knows apiResponse is RouteResponse here
    console.log(`Route is ${apiResponse.distance}km`);
  } else {
    console.error("Invalid route response format");
  }
}

// ============================================================================
// 6. BUILDING TYPE-SAFE FORMS
// ============================================================================

import { useState } from "react";

/**
 * Example: Form state matching API types
 */
export function useRouteForm() {
  /** @type {RouteRequest} */
  const [formData, setFormData] = useState({
    from_location: "",
    to_location: "",
    truck_id: 0,
    llm_model: DEFAULT_LLM_MODEL,
    use_ai_optimization: true,
    time_mode: TIME_MODES.DEPARTURE,
  });

  /**
   * Update form field with type safety
   * @param {keyof RouteRequest} field
   * @param {any} value
   */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return { formData, updateField };
}

// ============================================================================
// 7. HANDLING OPTIONAL FIELDS
// ============================================================================

/**
 * Example: Working with optional fields
 *
 * @param {TruckModel} truck
 * @returns {string}
 */
export function getTruckStatus(truck) {
  // Optional fields might be undefined
  if (truck.current_location) {
    return `At ${truck.current_location}`;
  }

  if (truck.status === TRUCK_STATUS.AVAILABLE) {
    return "Ready for dispatch";
  }

  return "Status unknown";
}

// ============================================================================
// 8. ARRAY OPERATIONS WITH TYPES
// ============================================================================

/**
 * Example: Filtering and mapping with types
 *
 * @param {TruckModel[]} trucks
 * @returns {TruckModel[]}
 */
export function getAvailableTrucks(trucks) {
  return trucks
    .filter((truck) => truck.status === TRUCK_STATUS.AVAILABLE)
    .filter((truck) => truck.fuel_level > 20)
    .sort((a, b) => b.fuel_level - a.fuel_level);
}

/**
 * Example: Calculating statistics from typed arrays
 *
 * @param {StationModel[]} stations
 * @returns {{ total: number, critical: number, avgInventory: number }}
 */
export function getStationStats(stations) {
  const critical = stations.filter(
    (s) => s.current_inventory < s.min_inventory_threshold
  );
  const avgInventory =
    stations.reduce((sum, s) => sum + s.current_inventory, 0) / stations.length;

  return {
    total: stations.length,
    critical: critical.length,
    avgInventory: Math.round(avgInventory),
  };
}

// ============================================================================
// 9. ERROR HANDLING WITH TYPES
// ============================================================================

/**
 * Example: Typed error responses
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {number} status
 * @property {string} [detail]
 */

/**
 * Example: Error handling with type safety
 *
 * @param {RouteRequest} request
 * @returns {Promise<RouteResponse | ApiError>}
 */
export async function optimizeRouteWithErrorHandling(request) {
  try {
    return await calculateOptimalRoute(request);
  } catch (error) {
    /** @type {ApiError} */
    return {
      message: error.response?.data?.message || "Route optimization failed",
      status: error.response?.status || 500,
      detail: error.response?.data?.detail,
    };
  }
}

// ============================================================================
// 10. BEST PRACTICES CHECKLIST
// ============================================================================

/**
 * ✅ DO: Use JSDoc @typedef to import types
 * ✅ DO: Type function parameters and return values
 * ✅ DO: Use type guards for runtime validation
 * ✅ DO: Regenerate types after backend changes
 * ✅ DO: Use 'keyof' for field name validation
 *
 * ❌ DON'T: Manually edit generated types
 * ❌ DON'T: Use 'any' to bypass type checking
 * ❌ DON'T: Assume API response shape without types
 * ❌ DON'T: Forget to regenerate after backend updates
 */
