import { CloudIcon, SunIcon } from "@heroicons/react/24/outline";

function WeatherImpactCard({ weatherImpact }) {
  if (!weatherImpact || !weatherImpact.fromLocation) {
    return null;
  }

  const { fromLocation, toLocation, routeImpact, drivingConditions } =
    weatherImpact;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Weather Impact</h3>
        <CloudIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* From Location Weather */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Start: {fromLocation.city || "N/A"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-600">Temp:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {fromLocation.temperature || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Wind:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {fromLocation.wind || "N/A"}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {fromLocation.condition || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* To Location Weather */}
        <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-800 mb-2">
                Destination: {toLocation.city || "N/A"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-800">Temp:</span>
                  <span className="ml-1 font-medium text-slate-800">
                    {toLocation.temperature || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-800">Wind:</span>
                  <span className="ml-1 font-medium text-slate-800">
                    {toLocation.wind || "N/A"}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {toLocation.condition || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Driving Conditions */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Driving Conditions:
            </span>
            <span
              className={`text-xs sm:text-sm font-semibold ${
                drivingConditions === "Normal"
                  ? "text-green-600"
                  : drivingConditions === "Cautious"
                  ? "text-yellow-600"
                  : "text-gray-600"
              }`}
            >
              {drivingConditions}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">{routeImpact}</p>
        </div>
      </div>
    </div>
  );
}

export default WeatherImpactCard;
