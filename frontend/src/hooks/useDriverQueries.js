import { useQuery } from "@tanstack/react-query";
import Api from "../services/api";

/**
 * Fetch all drivers with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by driver status (active, on_leave, inactive)
 * @param {boolean} filters.available_only - Only return available drivers
 * @returns {Object} Query result with drivers data
 */
export function useDrivers(filters = {}) {
  return useQuery({
    queryKey: ["drivers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.available_only !== undefined)
        params.append("available_only", filters.available_only);

      const response = await Api.request("/api/drivers", {
        params: params.toString() ? `?${params.toString()}` : "",
      });
      return response;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch available drivers (shortcut for available_only=true)
 * @returns {Object} Query result with available drivers
 */
export function useAvailableDrivers() {
  return useQuery({
    queryKey: ["drivers", "available"],
    queryFn: async () => {
      const response = await Api.request("/api/drivers/available");
      return response;
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single driver by ID
 * @param {number} driverId - The driver ID
 * @param {boolean} enabled - Whether the query should run
 * @returns {Object} Query result with driver data
 */
export function useDriver(driverId, enabled = true) {
  return useQuery({
    queryKey: ["drivers", driverId],
    queryFn: async () => {
      const response = await Api.request(`/api/drivers/${driverId}`);
      return response;
    },
    enabled: enabled && !!driverId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch shift history for a driver
 * @param {number} driverId - The driver ID
 * @param {number} limit - Maximum number of shifts to return
 * @param {boolean} enabled - Whether the query should run
 * @returns {Object} Query result with shift history
 */
export function useDriverShifts(driverId, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["drivers", driverId, "shifts", limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit);

      const response = await Api.request(
        `/api/drivers/${driverId}/shifts${
          params.toString() ? `?${params.toString()}` : ""
        }`
      );
      return response;
    },
    enabled: enabled && !!driverId,
    staleTime: 60000, // 1 minute
  });
}
