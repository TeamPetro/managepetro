// Shared environment variable configuration
// This file defines all required environment variables for the application
// Used by both vite.config.js (build-time validation) and src/config/env.js (runtime access)

export const REQUIRED_ENV_VARS = [
  { name: "VITE_API_BASE_URL", example: "https://your-backend-url" },
  { name: "VITE_DEFAULT_LLM_MODEL", example: "gemini-2.5-flash" },
  { name: "VITE_GOOGLE_MAPS_API_KEY", example: "your-google-maps-api-key" },
  // Add new required variables here:
  // { name: "VITE_NEW_VARIABLE", example: "default-value" },
];

export const OPTIONAL_ENV_VARS = [
  {
    name: "VITE_DEFAULT_DEPOT_LOCATION",
    example: "Toronto",
    default: "Toronto",
  },
  { name: "VITE_API_TIMEOUT", example: "120000", default: "120000" },
  { name: "VITE_DEV", example: "true", default: "false" },
  { name: "VITE_DEV_SERVER_PORT", example: "3000", default: "3000" },
  {
    name: "VITE_DEV_PROXY_TARGET",
    example: "http://localhost:8000",
    default: "http://localhost:8000",
  },
  { name: "VITE_TRIPS_DEFAULT_LIMIT", example: "50", default: "50" },
  { name: "VITE_DEBOUNCE_DELAY", example: "200", default: "200" },
];
