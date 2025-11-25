/**
 * Application-wide configuration constants
 * Centralizes magic strings and configuration values - DRY principle
 */

/**
 * Default LLM model for route optimization
 */
import { DEFAULT_LLM_MODEL } from "../config/env";
export { DEFAULT_LLM_MODEL };

/**
 * Available LLM models for selection
 */
export const LLM_MODELS = [
  // Google Gemini
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  
  // Groq Models (Free) - Current production models
  { value: "groq:llama-3.1-8b-instant", label: "Llama 3.1 8B (Free)" },
  { value: "groq:llama-3.3-70b-versatile", label: "Llama 3.3 70B (Free)" },
  
  // OpenAI Models
  { value: "openai:gpt-4o", label: "ChatGPT-4o" },
  { value: "openai:gpt-4o-mini", label: "ChatGPT-4o Mini" },
  
  // Anthropic Models
  { value: "anthropic:claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
  { value: "anthropic:claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },

];

/**
 * Default depot location for route optimization
 */
import { DEFAULT_DEPOT_LOCATION } from "../config/env";
export { DEFAULT_DEPOT_LOCATION };

/**
 * Vehicle types available for route optimization
 */
export const VEHICLE_TYPES = [
  { value: "fuel_delivery_truck", label: "Fuel Delivery Truck" },
  { value: "tanker_truck", label: "Tanker Truck" },
  { value: "cargo_truck", label: "Cargo Truck" },
];

/**
 * Time mode options for route optimization
 */
export const TIME_MODES = {
  DEPARTURE: "departure",
  ARRIVAL: "arrival",
};

/**
 * Fuel level thresholds for station priority
 */
export const FUEL_THRESHOLDS = {
  CRITICAL: 10,
  HIGH: 30,
  MEDIUM: 50,
};

/**
 * Truck status values
 */
export const TRUCK_STATUS = {
  ACTIVE: "active",
  MAINTENANCE: "maintenance",
  OFFLINE: "offline",
};

/**
 * Request methods for station fuel requests
 */
export const REQUEST_METHODS = {
  IOT: "IoT",
  MANUAL: "Manual",
};
