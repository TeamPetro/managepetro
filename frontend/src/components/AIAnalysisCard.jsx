import {
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { formatMarkdownForDisplay } from "../utils/textFormatting";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import Icon from "./Icon";

function AIAnalysisCard({ aiAnalysis, routeSummary }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!aiAnalysis && !routeSummary) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon size="lg">
            <SparklesIcon className="text-yellow-500" />
          </Icon>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            AI Route Analysis
          </h3>
        </div>
        <StatusBadge variant="ai">AI Generated</StatusBadge>
      </div>

      {/* Route Summary Info */}
      {routeSummary && (
        <div className="space-y-2 sm:space-y-3 mb-4">
          {routeSummary.primaryRoute && routeSummary.primaryRoute !== "N/A" && (
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Primary Route:
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right max-w-xs">
                {routeSummary.primaryRoute}
              </span>
            </div>
          )}

          {routeSummary.routeType && routeSummary.routeType !== "N/A" && (
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Route Type:
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right max-w-xs">
                {routeSummary.routeType}
              </span>
            </div>
          )}

          {routeSummary.bestDepartureTime &&
            routeSummary.bestDepartureTime !== "N/A" && (
              <div className="flex items-start justify-between py-2 border-b border-gray-100">
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  Best Departure:
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right max-w-xs">
                  {routeSummary.bestDepartureTime}
                </span>
              </div>
            )}

          {routeSummary.fuelStops && routeSummary.fuelStops !== "N/A" && (
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Fuel Stops:
              </span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right max-w-xs">
                {routeSummary.fuelStops}
              </span>
            </div>
          )}

          {routeSummary.estimatedFuelCost &&
            routeSummary.estimatedFuelCost !== "N/A" && (
              <div className="flex items-start justify-between py-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  Est. Fuel Cost:
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 text-right max-w-xs">
                  {routeSummary.estimatedFuelCost}
                </span>
              </div>
            )}

          {routeSummary.optimizationFactors &&
            routeSummary.optimizationFactors.length > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Optimization Factors:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {routeSummary.optimizationFactors.map((factor, index) => (
                    <StatusBadge
                      key={index}
                      variant="outline"
                      className="text-xs"
                    >
                      {factor}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Full AI Analysis (collapsible) */}
      {aiAnalysis && (
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>Full AI Analysis</span>
            {isExpanded ? (
              <Icon>
                <ChevronUpIcon />
              </Icon>
            ) : (
              <Icon>
                <ChevronDownIcon />
              </Icon>
            )}
          </button>

          {isExpanded && (
            <div className="mt-3 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-80 sm:max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {formatMarkdownForDisplay(aiAnalysis)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default AIAnalysisCard;
