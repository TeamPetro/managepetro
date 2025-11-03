/**
 * Dispatch-related React Query hooks
 * Provides hooks for dispatch optimization with caching and state management
 * @module hooks/useDispatchQueries
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  optimizeDispatch,
  optimizeDispatchWithTransform,
  getDispatchRecommendations,
  getDispatchFilters,
} from "../services/dispatch-api";
import { truckQueryKeys } from "./useTruckQueries";
import { stationQueryKeys } from "./useStationQueries";

/**
 * Query keys for dispatch operations
 */
export const dispatchQueryKeys = {
  recommendations: (params) => ["dispatch", "recommendations", params],
  filters: ["dispatch", "filters"],
};

/**
 * Hook for dispatch optimization mutation
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useOptimizeDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => optimizeDispatch(params),
    onSuccess: () => {
      // Invalidate and refetch relevant queries after successful dispatch
      queryClient.invalidateQueries({ queryKey: truckQueryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: stationQueryKeys.stations });
    },
  });
}

/**
 * Hook for dispatch optimization with automatic transformation
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useOptimizeDispatchWithTransform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dispatchData) => optimizeDispatchWithTransform(dispatchData),
    onSuccess: () => {
      // Invalidate and refetch relevant queries after successful dispatch
      queryClient.invalidateQueries({ queryKey: truckQueryKeys.trucks });
      queryClient.invalidateQueries({ queryKey: stationQueryKeys.stations });
    },
  });
}

/**
 * Hook for fetching AI-powered dispatch recommendations
 * @param {Object} params - Request parameters
 * @param {boolean} enabled - Whether the query should run
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useDispatchRecommendations(params, enabled = false) {
  return useQuery({
    queryKey: dispatchQueryKeys.recommendations(params),
    queryFn: () => getDispatchRecommendations(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching available dispatch filters
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useDispatchFilters() {
  return useQuery({
    queryKey: dispatchQueryKeys.filters,
    queryFn: () => getDispatchFilters(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
