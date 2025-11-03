import { MapPinIcon, SignalIcon } from "@heroicons/react/24/outline";

import { REQUEST_METHODS } from "../constants/config";

function StationNeedsCard({ station }) {
  const fuelLevelColor = (level) => {
    if (level >= 50) return "text-green-600 bg-green-100";
    if (level >= 25) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const requestMethodBadge = (method) => {
    if (method === REQUEST_METHODS.IOT) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <SignalIcon className="w-3 h-3 mr-1" />
          IoT Auto-Request
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Manual Request
      </span>
    );
  };

  const fuelNeeded = station.capacity_liters - station.current_level_liters;
  const fuelPercent =
    station.fuel_level ||
    Math.round((station.current_level_liters / station.capacity_liters) * 100);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:border-orange-300 transition-colors">
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {station.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {station.city}, {station.region}
              </p>
            </div>
          </div>
          {requestMethodBadge(station.request_method)}
        </div>

        {/* Fuel Level */}
        <div className="mb-3">
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span className="text-gray-600">Fuel Level</span>
            <span
              className={`font-semibold ${
                fuelLevelColor(fuelPercent).split(" ")[0]
              }`}
            >
              {fuelPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                fuelPercent >= 50
                  ? "bg-green-500"
                  : fuelPercent >= 25
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${fuelPercent}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div>
            <span className="text-gray-500">Fuel Type:</span>
            <span className="ml-1 font-medium text-gray-900">
              {station.fuel_type}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Current:</span>
            <span className="ml-1 font-medium text-gray-900">
              {station.current_level_liters.toLocaleString()} L
            </span>
          </div>
          <div>
            <span className="text-gray-500">Capacity:</span>
            <span className="ml-1 font-medium text-gray-900">
              {station.capacity_liters.toLocaleString()} L
            </span>
          </div>
          <div>
            <span className="text-gray-500">Needed:</span>
            <span className="ml-1 font-medium text-orange-600">
              {fuelNeeded.toLocaleString()} L
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StationNeedsCard;
