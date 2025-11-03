// Centralized frontend environment config for Vite
// Throws a clear error if any required env variable is missing

import { REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS } from "./env-config.js";

export function requireEnv(varName, example = "") {
  const value = import.meta.env[varName];
  if (!value || value === "") {
    throw new Error(
      `Missing required environment variable: ${varName}\n` +
        (example ? `Example: ${varName}=${example}\n` : "") +
        `Add this to your .env file in the frontend folder.`
    );
  }
  return value;
}

export function optionalEnv(varName, defaultValue = "") {
  const value = import.meta.env[varName];
  return value || defaultValue;
}

// Create exports for all required environment variables
export const API_BASE_URL = requireEnv(
  "VITE_API_BASE_URL",
  REQUIRED_ENV_VARS.find((v) => v.name === "VITE_API_BASE_URL")?.example
);
export const DEFAULT_LLM_MODEL = requireEnv(
  "VITE_DEFAULT_LLM_MODEL",
  REQUIRED_ENV_VARS.find((v) => v.name === "VITE_DEFAULT_LLM_MODEL")?.example
);
export const GOOGLE_MAPS_API_KEY = requireEnv(
  "VITE_GOOGLE_MAPS_API_KEY",
  REQUIRED_ENV_VARS.find((v) => v.name === "VITE_GOOGLE_MAPS_API_KEY")?.example
);

// Create exports for optional environment variables with defaults
export const DEFAULT_DEPOT_LOCATION = optionalEnv(
  "VITE_DEFAULT_DEPOT_LOCATION",
  OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_DEFAULT_DEPOT_LOCATION")
    ?.default
);
export const API_TIMEOUT = parseInt(
  optionalEnv(
    "VITE_API_TIMEOUT",
    OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_API_TIMEOUT")?.default
  )
);
export const DEV_MODE =
  optionalEnv(
    "VITE_DEV",
    OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_DEV")?.default
  ) === "true";
export const DEV_SERVER_PORT = parseInt(
  optionalEnv(
    "VITE_DEV_SERVER_PORT",
    OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_DEV_SERVER_PORT")?.default
  )
);
export const DEV_PROXY_TARGET = optionalEnv(
  "VITE_DEV_PROXY_TARGET",
  OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_DEV_PROXY_TARGET")?.default
);
export const TRIPS_DEFAULT_LIMIT = parseInt(
  optionalEnv(
    "VITE_TRIPS_DEFAULT_LIMIT",
    OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_TRIPS_DEFAULT_LIMIT")
      ?.default
  )
);
export const DEBOUNCE_DELAY = parseInt(
  optionalEnv(
    "VITE_DEBOUNCE_DELAY",
    OPTIONAL_ENV_VARS.find((v) => v.name === "VITE_DEBOUNCE_DELAY")?.default
  )
);

// Fail fast on all required envs (call this in main.jsx)
export function checkRequiredEnvs() {
  REQUIRED_ENV_VARS.forEach(({ name, example }) => {
    requireEnv(name, example);
  });
}

// Always append /api to the base URL, regardless of what it is
export function getApiBaseUrl() {
  return API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;
}
