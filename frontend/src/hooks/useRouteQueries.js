/**
 * Route-related React Query hooks
 * Provides hooks for route optimization with caching and state management
 * @module hooks/useRouteQueries
 */

import { useMutation } from "@tanstack/react-query";

import {
  optimizeRoute,
  optimizeRouteWithTransform,
} from "../services/routes-api";
import { TIME_MODES } from "../constants/config";

/**
 * Hook for route optimization mutation
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useOptimizeRoute() {
  return useMutation({
    mutationFn: ({ from, to, llmModel, timeData = {} }) =>
      optimizeRoute({
        from_location: from,
        to_location: to,
        llm_model: llmModel,
        use_ai_optimization: true,
        departure_time: timeData.departureTime || null,
        arrival_time: timeData.arrivalTime || null,
        time_mode: timeData.timeMode || TIME_MODES.DEPARTURE,
        delivery_date: timeData.deliveryDate || null,
        vehicle_type: timeData.vehicleType || "fuel_delivery_truck",
        notes: timeData.notes || null,
      }),
  });
}

/**
 * Hook for route optimization with automatic transformation
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useOptimizeRouteWithTransform() {
  return useMutation({
    mutationFn: ({ from, to, llmModel }) =>
      optimizeRouteWithTransform(from, to, llmModel),
  });
}
