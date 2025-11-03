/**
 * Routes API service
 * Handles all route-related API operations
 * @module services/routes-api
 */

import { DEFAULT_LLM_MODEL } from "../constants/config";
import { httpClient } from "./http-client";
import { transformRouteResponse } from "./transformers";

/**
 * Types from auto-generated API schema
 * @typedef {import('../types/api').RouteRequest} RouteRequest
 */

/**
 * @typedef {import('./types').RouteOptimizationResponse} RouteOptimizationResponse
 * @typedef {import('./types').TransformedRouteData} TransformedRouteData
 */

/**
 * Optimize route between two locations
 * @param {RouteRequest} params - Route optimization request (synced with backend)
 * @returns {Promise<RouteOptimizationResponse>}
 */
export function optimizeRoute(params) {
  return httpClient.post("/routes/optimize", params);
}

/**
 * Calculate optimized route between two locations with transformation
 * This method handles both the API call and transformation
 * @param {string} from - Starting location
 * @param {string} to - Destination location
 * @param {string} [llmModel] - Selected LLM model (defaults to DEFAULT_LLM_MODEL from config)
 * @returns {Promise<TransformedRouteData>}
 */
export async function optimizeRouteWithTransform(
  from,
  to,
  llmModel = DEFAULT_LLM_MODEL
) {
  const response = await optimizeRoute({
    from_location: from,
    to_location: to,
    llm_model: llmModel,
    use_ai_optimization: true,
  });
  return transformRouteResponse(response);
}

/**
 * Optimize route using TomTom
 * @param {Object} routeData
 * @returns {Promise<any>}
 */
export function tomtom(routeData) {
  return httpClient.post("/routes/tomtom", routeData);
}

/**
 * Calculate reachable range
 * @param {Object} rangeData
 * @returns {Promise<any>}
 */
export function reachableRange(rangeData) {
  return httpClient.post("/routes/reachable-range", rangeData);
}
