/**
 * Truck-related React Query hooks
 * Provides hooks for truck data fetching with caching and state management
 * @module hooks/useTruckQueries
 */

import { useQuery } from "@tanstack/react-query";
import { getTrucks, getTruck } from "../services/trucks-api";

/**
 * Query keys for truck-related cache management
 */
export const truckQueryKeys = {
  trucks: ["trucks"],
  truck: (id) => ["trucks", id],
};

/**
 * Hook to fetch all trucks
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useTrucks() {
  return useQuery({
    queryKey: truckQueryKeys.trucks,
    queryFn: getTrucks,
  });
}

/**
 * Hook to fetch a single truck by ID
 * @param {string} id - Truck ID
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useTruck(id) {
  return useQuery({
    queryKey: truckQueryKeys.truck(id),
    queryFn: () => getTruck(id),
    enabled: !!id,
  });
}
