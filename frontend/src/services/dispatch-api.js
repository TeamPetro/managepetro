/**
 * Dispatch API service
 * Handles all dispatch-related API operations
 * @module services/dispatch-api
 */

import { httpClient } from "./http-client";
import { transformDispatchResponse } from "./transformers";

/**
 * Types from auto-generated API schema
 * @typedef {import('../types/api').DispatchOptimizationRequest} DispatchOptimizationRequest
 */

/**
 * @typedef {import('./types').DispatchOptimizationResponse} DispatchOptimizationResponse
 */

/**
 * Optimize dispatch
 * @param {DispatchOptimizationRequest} dispatchData - Dispatch request (synced with backend)
 * @returns {Promise<DispatchOptimizationResponse>}
 */
export function optimizeDispatch(dispatchData) {
  return httpClient.post("/dispatch/optimize", dispatchData);
}

/**
 * Optimize dispatch with transformation
 * @param {Object} dispatchData
 * @returns {Promise<Object>} Standardized dispatch data
 */
export async function optimizeDispatchWithTransform(dispatchData) {
  const response = await optimizeDispatch(dispatchData);
  return transformDispatchResponse(response);
}

/**
 * Get AI-powered dispatch recommendations
 * @param {Object} params - Request parameters
 * @param {string} params.depot_location - Starting depot location
 * @param {string} params.llm_model - AI model to use
 * @param {number} params.max_recommendations - Maximum recommendations to return
 * @param {string} params.filter_region - Optional region filter
 * @param {string} params.filter_city - Optional city filter
 * @returns {Promise<Object>} Dispatch recommendations
 */
export function getDispatchRecommendations(params) {
  return httpClient.post("/dispatch/recommendations", params);
}

/**
 * Get available filters for dispatch recommendations
 * @returns {Promise<Object>} Available regions and cities
 */
export function getDispatchFilters() {
  return httpClient.get("/dispatch/filters");
}
