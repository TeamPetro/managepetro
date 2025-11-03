import { TruckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

import { TRUCK_STATUS } from "../constants/config";

function TruckDispatchCard({ truck, onOptimize, isOptimizing, disabled }) {
  const statusColor = {
    [TRUCK_STATUS.ACTIVE]: "bg-green-100 text-green-800",
    [TRUCK_STATUS.MAINTENANCE]: "bg-yellow-100 text-yellow-800",
    [TRUCK_STATUS.OFFLINE]: "bg-red-100 text-red-800",
  };

  const fuelLevelColor = (level) => {
    if (level >= 70) return "bg-green-500";
    if (level >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <TruckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {truck.code}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {truck.plate_number}
              </p>
            </div>
          </div>
          <span
            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
              statusColor[truck.status] || statusColor.offline
            }`}
          >
            {truck.status}
          </span>
        </div>

        {/* Fuel Level */}
        <div className="mb-4">
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span className="text-gray-600">Fuel Level</span>
            <span className="font-medium text-gray-900">
              {truck.fuel_level_percent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${fuelLevelColor(
                truck.fuel_level_percent
              )}`}
              style={{ width: `${truck.fuel_level_percent}%` }}
            />
          </div>
        </div>

        {/* Compartments */}
        {truck.compartments && truck.compartments.length > 0 ? (
          <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Compartments ({truck.compartments.length})
            </h4>
            <div className="space-y-2">
              {truck.compartments.map((comp) => {
                const fillPercent =
                  (comp.current_level_liters / comp.capacity_liters) * 100;
                return (
                  <div
                    key={comp.compartment_number}
                    className="text-xs bg-gray-50 p-2 rounded"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-700">
                        Compartment {comp.compartment_number} ({comp.fuel_type})
                      </span>
                      <span className="text-gray-600">
                        {comp.current_level_liters.toLocaleString()} /{" "}
                        {comp.capacity_liters.toLocaleString()} L
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="text-xs bg-gray-50 p-2 rounded">
              <span className="font-medium text-gray-700">
                Single Compartment ({truck.fuel_type})
              </span>
              <span className="text-gray-600 ml-2">
                {truck.capacity_liters.toLocaleString()} L
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onOptimize(truck)}
          disabled={
            disabled || truck.status !== TRUCK_STATUS.ACTIVE || isOptimizing
          }
          className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
            truck.status === TRUCK_STATUS.ACTIVE && !disabled
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isOptimizing ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Optimizing...
            </span>
          ) : truck.status === TRUCK_STATUS.MAINTENANCE ? (
            <span className="flex items-center justify-center">
              <WrenchScrewdriverIcon className="w-4 h-4 mr-2" />
              Under Maintenance
            </span>
          ) : (
            "Optimize Dispatch"
          )}
        </button>
      </div>
    </div>
  );
}

export default TruckDispatchCard;
