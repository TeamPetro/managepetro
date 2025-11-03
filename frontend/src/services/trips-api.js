/**
 * Trips API service
 * Handles all trip-related API operations
 * @module services/trips-api
 */

import { TRIPS_DEFAULT_LIMIT } from "../config/env";
import { httpClient } from "./http-client";

/**
 * @typedef {import('./types').Trip} Trip
 */

/**
 * Get trips with optional filtering
 * @param {{ limit?: number, successfulOnly?: boolean }} [options]
 * @returns {Promise<{ trips: Trip[], count?: number, total_available?: number }>}
 */
export function getTrips({ limit, successfulOnly = false } = {}) {
  const actualLimit = limit !== undefined ? limit : TRIPS_DEFAULT_LIMIT;
  return httpClient.get("/trips", {
    limit: actualLimit,
    successful_only: successfulOnly,
  });
}

/**
 * Get a single trip by id
 * @param {string} id
 * @returns {Promise<{ trip: Trip }>}
 */
export function getTrip(id) {
  return httpClient.get(`/trips/${id}`);
}
