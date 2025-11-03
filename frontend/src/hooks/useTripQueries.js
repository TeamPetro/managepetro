/**
 * Trip-related React Query hooks
 * Provides hooks for trip data fetching with caching and state management
 * @module hooks/useTripQueries
 */

import { useQuery } from "@tanstack/react-query";
import { getTrips, getTrip } from "../services/trips-api";

/**
 * Query keys for trip-related cache management
 */
export const tripQueryKeys = {
  trips: (options) => ["trips", options],
  trip: (id) => ["trips", id],
};

/**
 * Hook to fetch trips with optional filters
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Maximum number of trips to fetch
 * @param {boolean} [options.successfulOnly] - Filter for successful trips only
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useTrips(options = {}) {
  return useQuery({
    queryKey: tripQueryKeys.trips(options),
    queryFn: () => getTrips(options),
  });
}

/**
 * Hook to fetch a single trip by ID
 * @param {string} id - Trip ID
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useTrip(id) {
  return useQuery({
    queryKey: tripQueryKeys.trip(id),
    queryFn: () => getTrip(id),
    enabled: !!id,
  });
}
