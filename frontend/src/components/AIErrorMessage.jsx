import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/**
 * AIErrorMessage - Specialized error component for AI optimization failures
 * Shows when AI services fail for route optimization or dispatch optimization
 */
function AIErrorMessage({
  message = "AI optimization service is currently unavailable",
  onRetry,
  onDismiss,
  context = "optimization",
}) {
  const getContextTitle = () => {
    switch (context) {
      case "route":
        return "Route Optimization Failed";
      case "dispatch":
        return "Dispatch Optimization Failed";
      default:
        return "AI Optimization Failed";
    }
  };

  const getContextMessage = () => {
    if (
      message &&
      message !== "AI optimization service is currently unavailable"
    ) {
      return message;
    }

    switch (context) {
      case "route":
        return "Unable to generate AI-powered route recommendations. You can still use basic routing or try again.";
      case "dispatch":
        return "Unable to generate AI-powered dispatch recommendations. You can still plan manually or try again.";
      default:
        return "AI optimization service is currently unavailable. Please try again or proceed with manual planning.";
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-amber-800">
              {getContextTitle()}
            </h3>
            <p className="text-xs sm:text-sm text-amber-700 mt-1">
              {getContextMessage()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 transition-colors"
              >
                Continue Manually
              </button>
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AIErrorMessage;
