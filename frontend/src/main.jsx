import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GOOGLE_MAPS_API_KEY } from "./config/env";

/**
 * Load Google Maps JavaScript API script
 * Ensures script is only loaded once and handles errors gracefully
 */
function loadGoogleMapsScript() {
  // Check if script is already loaded
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;

  // Add error handling
  script.onerror = () => {
    console.error("Failed to load Google Maps API script");
  };

  document.head.appendChild(script);
}

// Load Google Maps script
loadGoogleMapsScript();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
