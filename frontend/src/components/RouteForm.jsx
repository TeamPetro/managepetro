import { useState } from "react";
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ClockIcon,
  CalendarIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { VEHICLE_TYPES, TIME_MODES } from "../constants/config";
import { DEBOUNCE_DELAY } from "../config/env";

function RouteForm({ onSubmit, isLoading = false }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [timeMode, setTimeMode] = useState(TIME_MODES.DEPARTURE);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0].value);
  const [notes, setNotes] = useState("");

  // --- ensure Places library is ready (no callback racing) ---
  const ensurePlacesReady = () =>
    new Promise((resolve, reject) => {
      if (window.google?.maps?.places) return resolve();
      const started = Date.now();
      const t = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(t);
          resolve();
        } else if (Date.now() - started > 10000) {
          clearInterval(t);
          reject(new Error("Google Places failed to load"));
        }
      }, 50);
    });

  // Debounce helper to avoid spamming predictions
  let debounceTimer;
  const debounced = (fn, delay = DEBOUNCE_DELAY) => {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fn(...args), delay);
    };
  };

  const getPredictions = async (query, setter) => {
    if (query.length < 3) {
      setter([]);
      return;
    }
    try {
      await ensurePlacesReady();
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          // tweak these to your needs:
          componentRestrictions: { country: "ca" }, // remove or change if needed
          // types: ["geocode"], // uncomment to favor address results
        },
        (predictions, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setter(
              predictions.map((p) => ({
                name: p.description,
                placeId: p.place_id,
              }))
            );
          } else {
            setter([]);
          }
        }
      );
    } catch (e) {
      console.error(e);
      setter([]);
    }
  };

  const fetchFrom = debounced((q) => getPredictions(q, setFromSuggestions));
  const fetchTo = debounced((q) => getPredictions(q, setToSuggestions));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (from.trim() && to.trim() && !isLoading) {
      const timeData = {
        timeMode,
        departureTime: timeMode === TIME_MODES.DEPARTURE ? departureTime : null,
        arrivalTime: timeMode === TIME_MODES.ARRIVAL ? arrivalTime : null,
        deliveryDate: deliveryDate || null,
        vehicleType,
        notes: notes.trim() || null,
      };
      onSubmit(from.trim(), to.trim(), timeData);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* From Input */}
          <div className="space-y-2">
            <label
              htmlFor="from"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              From
            </label>
            <div className="relative">
              <input
                type="text"
                id="from"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  fetchFrom(e.target.value);
                }}
                onBlur={() => setTimeout(() => setFromSuggestions([]), 120)}
                placeholder="Enter starting location"
                autoComplete="off"
                disabled={isLoading}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            {fromSuggestions.length > 0 && (
              <ul className="absolute bg-white border rounded-lg shadow-lg mt-1 w-full z-50 max-h-56 overflow-y-auto">
                {fromSuggestions.map((s, i) => (
                  <li
                    key={`${s.placeId}-${i}`}
                    onMouseDown={() => {
                      setFrom(s.name);
                      setFromSuggestions([]);
                    }}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* To Input */}
          <div className="space-y-2">
            <label
              htmlFor="to"
              className="block text-xs sm:text-sm font-medium text-gray-700"
            >
              To
            </label>
            <div className="relative">
              <input
                type="text"
                id="to"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  fetchTo(e.target.value);
                }}
                onBlur={() => setTimeout(() => setToSuggestions([]), 120)}
                placeholder="Enter destination"
                autoComplete="off"
                disabled={isLoading}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </div>
            {toSuggestions.length > 0 && (
              <ul className="absolute bg-white border rounded-lg shadow-lg mt-1 w-full z-50 max-h-56 overflow-y-auto">
                {toSuggestions.map((s, i) => (
                  <li
                    key={`${s.placeId}-${i}`}
                    onMouseDown={() => {
                      setTo(s.name);
                      setToSuggestions([]);
                    }}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Time Preference */}
        <div className="space-y-3 border-t pt-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700">
            Time Preference (Optional)
          </label>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="timeMode"
                value={TIME_MODES.DEPARTURE}
                checked={timeMode === TIME_MODES.DEPARTURE}
                onChange={(e) => setTimeMode(e.target.value)}
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-700">
                Departure Time
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="timeMode"
                value={TIME_MODES.ARRIVAL}
                checked={timeMode === TIME_MODES.ARRIVAL}
                onChange={(e) => setTimeMode(e.target.value)}
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-700">
                Arrival Time
              </span>
            </label>
          </div>

          {/* Time input */}
          <div className="relative">
            <input
              type="time"
              id="timeInput"
              value={
                timeMode === TIME_MODES.DEPARTURE ? departureTime : arrivalTime
              }
              onChange={(e) =>
                timeMode === TIME_MODES.DEPARTURE
                  ? setDepartureTime(e.target.value)
                  : setArrivalTime(e.target.value)
              }
              disabled={isLoading}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={
                timeMode === TIME_MODES.DEPARTURE
                  ? "Select departure time"
                  : "Select arrival time"
              }
            />
            <ClockIcon className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>

          <p className="text-xs text-gray-500">
            {timeMode === TIME_MODES.DEPARTURE
              ? "AI will calculate when you'll arrive"
              : "AI will calculate when you should leave"}
          </p>
        </div>

        {/* Additional Options */}
        <div className="space-y-3 border-t pt-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700">
            Additional Options
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Delivery Date */}
            <div className="space-y-2">
              <label
                htmlFor="deliveryDate"
                className="block text-xs font-medium text-gray-600"
              >
                Preferred Delivery Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="deliveryDate"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <CalendarIcon className="absolute left-2.5 sm:left-3 top-2 sm:top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <label
                htmlFor="vehicleType"
                className="block text-xs font-medium text-gray-600"
              >
                Vehicle Type
              </label>
              <div className="relative">
                <select
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <TruckIcon className="absolute left-2.5 sm:left-3 top-2 sm:top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-xs font-medium text-gray-600"
            >
              Delivery Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows="2"
              placeholder="Add any special instructions or requirements..."
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!from.trim() || !to.trim() || isLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <span>Optimize Route</span>
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RouteForm;
