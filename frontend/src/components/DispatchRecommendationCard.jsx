import {
  SparklesIcon,
  TruckIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

function DispatchRecommendationCard({
  recommendation,
  onViewDetails,
  onDispatch,
  isDispatching = false,
}) {
  const getPriorityColor = (priority) => {
    const colors = {
      Critical: "border-red-500 bg-red-50",
      High: "border-orange-500 bg-orange-50",
      Medium: "border-yellow-500 bg-yellow-50",
      Low: "border-blue-500 bg-blue-50",
    };
    return colors[priority] || colors.Medium;
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      Critical: "bg-red-100 text-red-800",
      High: "bg-orange-100 text-orange-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-blue-100 text-blue-800",
    };
    return colors[priority] || colors.Medium;
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 sm:p-6 transition-all hover:shadow-lg ${getPriorityColor(
        recommendation.priority
      )}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {recommendation.truck_code}
            </h3>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(
                recommendation.priority
              )}`}
            >
              {recommendation.priority} Priority
            </span>
          </div>
        </div>
        <SparklesIcon className="w-6 h-6 text-blue-600" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500">Stations</div>
          <div className="text-lg font-bold text-gray-900">
            {recommendation.station_count}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500">Distance</div>
          <div className="text-lg font-bold text-gray-900">
            {recommendation.total_distance}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500">Duration</div>
          <div className="text-lg font-bold text-gray-900">
            {recommendation.estimated_duration}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-xs text-gray-500">Fuel</div>
          <div className="text-lg font-bold text-gray-900">
            {recommendation.total_fuel_delivery}
          </div>
        </div>
      </div>

      {/* Route Summary */}
      {recommendation.route_summary && (
        <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-start space-x-2">
            <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">Route</div>
              <div className="text-sm text-gray-900 font-medium">
                {recommendation.route_summary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rationale */}
      {recommendation.rationale && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">AI Rationale</div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {recommendation.rationale}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(recommendation)}
          className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          View Details
        </button>
        <button
          onClick={() => onDispatch(recommendation)}
          disabled={isDispatching}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
            isDispatching
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isDispatching && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          )}
          {isDispatching ? "Dispatching..." : "Dispatch Now"}
        </button>
      </div>
    </div>
  );
}

export default DispatchRecommendationCard;
