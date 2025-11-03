/**
 * Station-related React Query hooks
 * Provides hooks for station data fetching with caching and state management
 * @module hooks/useStationQueries
 */

import { useQuery } from "@tanstack/react-query";
import { getStations, getStation } from "../services/stations-api";

/**
 * Query keys for station-related cache management
 */
export const stationQueryKeys = {
  stations: ["stations"],
  station: (id) => ["stations", id],
};

/**
 * Hook to fetch all stations
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useStations() {
  return useQuery({
    queryKey: stationQueryKeys.stations,
    queryFn: getStations,
  });
}

/**
 * Hook to fetch a single station by ID
 * @param {string} id - Station ID
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useStation(id) {
  return useQuery({
    queryKey: stationQueryKeys.station(id),
    queryFn: () => getStation(id),
    enabled: !!id,
  });
}
