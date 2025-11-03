import { XMarkIcon, TruckIcon, MapIcon } from "@heroicons/react/24/outline";

import { formatMarkdownForDisplay } from "../utils/textFormatting";
import { REQUEST_METHODS } from "../constants/config";

function DispatchResultCard({ result, onClose }) {
  const {
    dispatch_summary,
    truck,
    route_stops,
    ai_analysis,
    stations_available,
    depot_location,
  } = result;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-t-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <TruckIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold truncate">
                Dispatch Optimization Result
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 truncate">
                {truck.code} - {truck.plate}
                {depot_location && ` • Depot: ${depot_location}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Dispatch Summary */}
        {dispatch_summary && Object.keys(dispatch_summary).length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Dispatch Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {dispatch_summary.total_stations && (
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Stations to Visit
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-blue-600">
                    {formatMarkdownForDisplay(
                      String(dispatch_summary.total_stations)
                    )}
                  </div>
                </div>
              )}
              {dispatch_summary.total_distance && (
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total Distance
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-green-600">
                    {formatMarkdownForDisplay(
                      String(dispatch_summary.total_distance)
                    )}
                  </div>
                </div>
              )}
              {dispatch_summary.estimated_duration && (
                <div className="bg-purple-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Estimated Duration
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-purple-600">
                    {formatMarkdownForDisplay(
                      String(dispatch_summary.estimated_duration)
                    )}
                  </div>
                </div>
              )}
              {dispatch_summary.total_fuel && (
                <div className="bg-orange-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Total Fuel Delivery
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-orange-600">
                    {formatMarkdownForDisplay(
                      String(dispatch_summary.total_fuel)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timing */}
            {(dispatch_summary.departure_time ||
              dispatch_summary.return_time) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                {dispatch_summary.departure_time && (
                  <div>
                    <span className="text-gray-600">Departure Time:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatMarkdownForDisplay(
                        String(dispatch_summary.departure_time)
                      )}
                    </span>
                  </div>
                )}
                {dispatch_summary.return_time && (
                  <div>
                    <span className="text-gray-600">Return to Depot:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {formatMarkdownForDisplay(
                        String(dispatch_summary.return_time)
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Route Stops */}
        {route_stops && route_stops.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <MapIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Optimized Route ({route_stops.length} stops)
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {route_stops.map((stop, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {formatMarkdownForDisplay(String(stop.station))}
                      </h4>
                      <div className="mt-2 text-xs sm:text-sm space-y-1">
                        {stop.distance && (
                          <div>
                            <span className="text-gray-600">Distance:</span>
                            <span className="ml-2 text-gray-900">
                              {formatMarkdownForDisplay(String(stop.distance))}
                            </span>
                          </div>
                        )}
                        {stop.fuel_delivery && (
                          <div>
                            <span className="text-gray-600">
                              Fuel to Deliver:
                            </span>
                            <span className="ml-2 font-medium text-blue-600">
                              {formatMarkdownForDisplay(
                                String(stop.fuel_delivery)
                              )}
                            </span>
                          </div>
                        )}
                        {stop.eta && (
                          <div>
                            <span className="text-gray-600">ETA:</span>
                            <span className="ml-2 text-gray-900">
                              {formatMarkdownForDisplay(String(stop.eta))}
                            </span>
                          </div>
                        )}
                        {stop.reason && (
                          <div>
                            <span className="text-gray-600">Reason:</span>
                            <span className="ml-2 text-gray-700">
                              {formatMarkdownForDisplay(String(stop.reason))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Truck Compartments */}
        {truck.compartments && truck.compartments.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Truck Compartments
            </h3>
            <div className="space-y-2">
              {truck.compartments.map((comp) => (
                <div
                  key={comp.compartment_number}
                  className="bg-gray-50 p-2 sm:p-3 rounded-lg"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
                      Compartment {comp.compartment_number}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                      {comp.fuel_type}
                    </span>
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-gray-600">
                    {comp.current_level_liters.toLocaleString()} L available
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stations Available (for reference) */}
        {stations_available && stations_available.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Stations Considered ({stations_available.length})
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                All stations needing fuel that were considered for this
                dispatch:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {stations_available.map((station) => (
                  <div
                    key={station.station_id}
                    className="bg-white p-2 rounded text-xs border border-gray-200"
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {station.name} - {station.city}
                    </div>
                    <div className="text-gray-600 mt-1 truncate">
                      {station.fuel_type} • {station.fuel_level_percent}% full •
                      {station.request_method === REQUEST_METHODS.IOT
                        ? " Auto-Request"
                        : " Manual"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {ai_analysis && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              AI Analysis
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {formatMarkdownForDisplay(ai_analysis)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 rounded-b-lg">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm sm:text-base bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default DispatchResultCard;
