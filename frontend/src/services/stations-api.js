/**
 * Stations API service
 * Handles all station-related API operations
 * @module services/stations-api
 */

import { httpClient } from "./http-client";

/**
 * @typedef {import('./types').Station} Station
 */

/**
 * Get all stations
 * @returns {Promise<{ stations: Station[], count?: number }>}
 */
export function getStations() {
  return httpClient.get("/stations");
}

/**
 * Get a station by id
 * @param {string} id
 * @returns {Promise<{ station: Station }>}
 */
export function getStation(id) {
  return httpClient.get(`/stations/${id}`);
}
