import { useState } from "react";
import { useTrucks } from "../hooks/useTruckQueries";
import { useStations } from "../hooks/useStationQueries";
import {
  useOptimizeDispatch,
  useDispatchRecommendations,
  useDispatchFilters,
} from "../hooks/useDispatchQueries";
import LoadingState from "../components/LoadingState";
import ErrorMessage from "../components/ErrorMessage";
import AIErrorMessage from "../components/AIErrorMessage";
import DispatchRecommendationCard from "../components/DispatchRecommendationCard";
import DispatchResultCard from "../components/DispatchResultCard";
import PageLayout from "../components/PageLayout";
import {
  SparklesIcon,
  TruckIcon,
  MapPinIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Api from "../services/api";
import {
  DEFAULT_DEPOT_LOCATION,
  DEFAULT_LLM_MODEL,
  LLM_MODELS,
  FUEL_THRESHOLDS,
  TRUCK_STATUS,
  REQUEST_METHODS,
} from "../constants/config";

function ImprovedDispatcherPage() {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [depotLocation, setDepotLocation] = useState(DEFAULT_DEPOT_LOCATION);
  const [llmModel, setLlmModel] = useState(DEFAULT_LLM_MODEL);
  const [dispatchError, setDispatchError] = useState(null);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dispatchingRecommendation, setDispatchingRecommendation] =
    useState(null);

  // Fetch data using React Query
  const {
    data: trucksData,
    isPending: trucksLoading,
    error: trucksError,
  } = useTrucks();
  const {
    data: stationsData,
    isPending: stationsLoading,
    error: stationsError,
  } = useStations();

  // Fetch available filters
  const { data: filtersData } = useDispatchFilters();

  // Fetch AI recommendations
  const {
    data: recommendationsData,
    isPending: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useDispatchRecommendations(
    {
      depot_location: depotLocation,
      llm_model: llmModel,
      max_recommendations: 5,
      filter_region: filterRegion || undefined,
      filter_city: filterCity || undefined,
    },
    showRecommendations
  );

  const optimizeDispatchMutation = useOptimizeDispatch();

  const trucks = trucksData?.trucks || [];
  const stations = stationsData?.stations || [];

  const activeTrucks = trucks.filter((t) => t.status === TRUCK_STATUS.ACTIVE);
  const stationsNeedingFuel = stations.filter(
    (station) =>
      station.needs_refuel || station.fuel_level < FUEL_THRESHOLDS.HIGH
  );

  // Calculate critical stations (fuel level < 20%)
  const criticalStations = stationsNeedingFuel.filter(
    (s) => s.fuel_level_percent < 20
  );
  const highPriorityStations = stationsNeedingFuel.filter(
    (s) => s.fuel_level_percent >= 20 && s.fuel_level_percent < 30
  );

  const isLoading = trucksLoading || stationsLoading;
  const error = trucksError || stationsError;

  const handleGetRecommendations = () => {
    setShowRecommendations(true);
    refetchRecommendations();
  };

  const handleViewDetails = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  const handleDispatchRecommendation = async (recommendation) => {
    setDispatchError(null);
    setDispatchingRecommendation(recommendation);

    // Find the truck code from recommendation
    const truckCode = recommendation.truck_code;

    optimizeDispatchMutation.mutate(
      {
        truck_id: truckCode,
        depot_location: depotLocation,
        llm_model: llmModel,
      },
      {
        onSuccess: (result) => {
          const transformedResult = Api.transformDispatchResponse(result);
          setDispatchResult(transformedResult);
          setSelectedRecommendation(null);
          setDispatchingRecommendation(null);
        },
        onError: (error) => {
          setDispatchResult(null);
          setDispatchError(error?.message || "Dispatch failed");
          setDispatchingRecommendation(null);
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading dispatcher data..." />;
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                AI-Powered Dispatch Center
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Let AI optimize your entire fleet dispatch strategy in seconds
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Dispatch Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="depotLocation"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Depot Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="depotLocation"
                    value={depotLocation}
                    onChange={(e) => setDepotLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter depot location"
                  />
                  <MapPinIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label
                  htmlFor="llmModel"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  AI Model
                </label>
                <select
                  id="llmModel"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LLM_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Filter by Region or City
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="filterRegion"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Region (Province/State)
                </label>
                <select
                  id="filterRegion"
                  value={filterRegion}
                  onChange={(e) => {
                    setFilterRegion(e.target.value);
                    setFilterCity(""); // Clear city when region changes
                  }}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">All Regions</option>
                  {filtersData?.regions?.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="filterCity"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  City
                </label>
                <select
                  id="filterCity"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="">All Cities</option>
                  {filtersData?.cities
                    ?.filter((c) => !filterRegion || c.region === filterRegion)
                    .map((cityData) => (
                      <option key={cityData.city} value={cityData.city}>
                        {cityData.city} ({cityData.region})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterRegion("");
                    setFilterCity("");
                  }}
                  className="w-full px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {(filterRegion || filterCity) && (
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              {filterRegion && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  Region: {filterRegion}
                </span>
              )}
              {filterCity && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  City: {filterCity}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error.message || "Failed to load data"} />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            Active Trucks
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-green-600">
            {activeTrucks.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            Stations Needing Fuel
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-orange-600">
            {stationsNeedingFuel.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border-2 border-orange-200">
          <div className="text-xs sm:text-sm font-medium text-gray-500 flex items-center">
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 mr-1" />
            High Priority Stations
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-orange-600">
            {highPriorityStations.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">20-30% fuel</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            IoT Auto-Requests
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-blue-600">
            {
              stationsNeedingFuel.filter(
                (s) => s.request_method === REQUEST_METHODS.IOT
              ).length
            }
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      {!showRecommendations && !dispatchResult && (
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Ready to Optimize Your Dispatch?
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                Our AI will analyze all {activeTrucks.length} active trucks and{" "}
                {stationsNeedingFuel.length} stations{" "}
                {filterRegion || filterCity ? (
                  <span className="font-semibold">
                    {filterCity ? `in ${filterCity}` : `in ${filterRegion}`}
                  </span>
                ) : (
                  ""
                )}{" "}
                to create the most efficient delivery plan, prioritizing
                critical stations and minimizing total distance.
              </p>
            </div>
            <button
              onClick={handleGetRecommendations}
              disabled={showRecommendations && recommendationsLoading}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <SparklesIcon className="w-6 h-6" />
              <span>
                {showRecommendations && recommendationsLoading
                  ? "Analyzing..."
                  : "Get AI Recommendations"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Dispatch Result Modal */}
      {dispatchResult && (
        <div className="mb-6">
          <DispatchResultCard
            result={dispatchResult}
            onClose={() => {
              setDispatchResult(null);
            }}
          />
        </div>
      )}

      {/* Dispatch Error */}
      {dispatchError && (
        <div className="mb-6">
          <ErrorMessage
            message={`Dispatch failed: ${dispatchError}`}
            onDismiss={() => setDispatchError(null)}
          />
        </div>
      )}

      {/* Recommendation Details Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
                  Dispatch Recommendation Details
                </h2>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Truck</span>
                      <div className="font-medium">
                        {selectedRecommendation.truck_code}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Priority</span>
                      <div className="font-medium">
                        {selectedRecommendation.priority}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Route Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Stations</span>
                      <div className="font-medium">
                        {selectedRecommendation.station_count}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Distance</span>
                      <div className="font-medium">
                        {selectedRecommendation.total_distance}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Duration</span>
                      <div className="font-medium">
                        {selectedRecommendation.estimated_duration}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Fuel Delivery
                      </span>
                      <div className="font-medium">
                        {selectedRecommendation.total_fuel_delivery}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route Summary */}
                {selectedRecommendation.route_summary && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Route Summary
                    </h3>
                    <p className="text-gray-700">
                      {selectedRecommendation.route_summary}
                    </p>
                  </div>
                )}

                {/* AI Rationale */}
                {selectedRecommendation.rationale && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      AI Rationale
                    </h3>
                    <p className="text-gray-700">
                      {selectedRecommendation.rationale}
                    </p>
                  </div>
                )}

                {/* Station Details */}
                {selectedRecommendation.stations &&
                  selectedRecommendation.stations.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Stations to Visit
                      </h3>
                      <div className="space-y-2">
                        {selectedRecommendation.stations.map(
                          (station, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0"
                            >
                              <div>
                                <div className="font-medium">
                                  {station.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {station.city}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {station.fuel_level_percent}% fuel
                                </div>
                                <div className="text-sm text-gray-500">
                                  {station.fuel_type}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDispatchRecommendation(selectedRecommendation);
                  }}
                  disabled={
                    dispatchingRecommendation === selectedRecommendation
                  }
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    dispatchingRecommendation === selectedRecommendation
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {dispatchingRecommendation === selectedRecommendation && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  )}
                  {dispatchingRecommendation === selectedRecommendation
                    ? "Dispatching Route..."
                    : "Dispatch This Route"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Section */}
      {showRecommendations && !dispatchResult && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
              AI Dispatch Recommendations
            </h2>
            <button
              onClick={() => setShowRecommendations(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Hide Recommendations
            </button>
          </div>

          {recommendationsError && (
            <div className="mb-4">
              <AIErrorMessage
                message={
                  recommendationsError?.message ||
                  "Failed to load recommendations"
                }
                context="dispatch recommendations"
                onRetry={refetchRecommendations}
                onDismiss={() => setShowRecommendations(false)}
              />
            </div>
          )}

          {recommendationsLoading ? (
            <LoadingState message="AI is analyzing optimal dispatch strategies..." />
          ) : recommendationsData?.recommendations?.length > 0 ? (
            <>
              {/* Recommendations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendationsData.recommendations.map((rec, index) => (
                  <DispatchRecommendationCard
                    key={index}
                    recommendation={rec}
                    onViewDetails={handleViewDetails}
                    onDispatch={handleDispatchRecommendation}
                    isDispatching={dispatchingRecommendation === rec}
                  />
                ))}
              </div>

              {/* Executive Summary */}
              {recommendationsData.summary && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Executive Summary
                  </h3>
                  <p className="text-sm text-blue-800">
                    {recommendationsData.summary}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No recommendations available. All stations may be adequately
                fueled or no trucks are available.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Reference Section - Only show when not showing recommendations */}
      {!showRecommendations && !dispatchResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Stations */}
          {criticalStations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Critical Stations ({criticalStations.length})
              </h3>
              <div className="space-y-3">
                {criticalStations.slice(0, 5).map((station) => (
                  <div
                    key={station.station_id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {station.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {station.city} • {station.fuel_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {station.fuel_level_percent}%
                      </div>
                      <div className="text-xs text-gray-500">fuel level</div>
                    </div>
                  </div>
                ))}
                {criticalStations.length > 5 && (
                  <div className="text-sm text-gray-500 text-center">
                    +{criticalStations.length - 5} more critical stations
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Trucks Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TruckIcon className="w-5 h-5 mr-2 text-blue-600" />
              Available Fleet ({activeTrucks.length})
            </h3>
            <div className="space-y-3">
              {activeTrucks.slice(0, 5).map((truck) => (
                <div
                  key={truck.truck_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {truck.code}
                    </div>
                    <div className="text-xs text-gray-500">
                      {truck.plate_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {truck.fuel_level_percent}%
                    </div>
                    <div className="text-xs text-gray-500">fuel level</div>
                  </div>
                </div>
              ))}
              {activeTrucks.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  +{activeTrucks.length - 5} more trucks available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default ImprovedDispatcherPage;
