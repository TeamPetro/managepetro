/**
 * Weather API service
 * Handles all weather-related API operations
 * @module services/weather-api
 */

import { httpClient } from "./http-client";

/**
 * Get weather data
 * @param {Object} weatherData
 * @returns {Promise<any>}
 */
export function getWeather(weatherData) {
  return httpClient.post("/weather", weatherData);
}
