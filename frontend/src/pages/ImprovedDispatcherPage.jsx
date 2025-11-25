import { useState, useMemo } from "react";
import { useTrucks } from "../hooks/useTruckQueries";
import { useStations } from "../hooks/useStationQueries";
import {
  useOptimizeDispatch,
  useDispatchRecommendations,
  useDispatchFilters,
} from "../hooks/useDispatchQueries";
import { executeDispatch } from "../services/dispatch-api";
import LoadingState from "../components/LoadingState";
import ErrorMessage from "../components/ErrorMessage";
import AIErrorMessage from "../components/AIErrorMessage";
import DispatchRecommendationCard from "../components/DispatchRecommendationCard";
import DispatchResultCard from "../components/DispatchResultCard";
import TruckDispatchCard from "../components/TruckDispatchCard";
import PageLayout from "../components/PageLayout";
import {
  SparklesIcon,
  TruckIcon,
  MapPinIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
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
  const [executingDispatch, setExecutingDispatch] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Fleet management states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("code");
  const [expandedTruckId, setExpandedTruckId] = useState(null);
  const [showFleetFilters, setShowFleetFilters] = useState(false);
  const [hasDriverFilter, setHasDriverFilter] = useState("all"); // "all", "assigned", "unassigned"

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

  const activeTrucks = trucks.filter(
    (t) => t.status === TRUCK_STATUS.ACTIVE && !t.has_active_deliveries
  );
  const stationsNeedingFuel = stations.filter(
    (station) =>
      station.needs_refuel || station.fuel_level < FUEL_THRESHOLDS.HIGH
  );

  // Critical & high-priority station buckets
  const criticalStations = stationsNeedingFuel.filter(
    (s) => s.fuel_level_percent < 20
  );
  const highPriorityStations = stationsNeedingFuel.filter(
    (s) => s.fuel_level_percent >= 20 && s.fuel_level_percent < 30
  );
  const hasCriticalStations = criticalStations.length > 0;

  // Filtered and sorted trucks for fleet management
  const filteredAndSortedTrucks = useMemo(() => {
    let filtered = [...activeTrucks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (truck) =>
          truck.code?.toLowerCase().includes(query) ||
          truck.plate_number?.toLowerCase().includes(query) ||
          truck.current_location?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((truck) => truck.status === statusFilter);
    }

    if (fuelTypeFilter !== "all") {
      filtered = filtered.filter((truck) => truck.fuel_type === fuelTypeFilter);
    }

    if (hasDriverFilter !== "all") {
      if (hasDriverFilter === "assigned") {
        filtered = filtered.filter((truck) => truck.driver_name);
      } else if (hasDriverFilter === "unassigned") {
        filtered = filtered.filter((truck) => !truck.driver_name);
      }
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "code":
          return (a.code || "").localeCompare(b.code || "");
        case "fuel_level":
          return (b.fuel_level_percent || 0) - (a.fuel_level_percent || 0);
        case "capacity":
          return (b.capacity_liters || 0) - (a.capacity_liters || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    activeTrucks,
    searchQuery,
    statusFilter,
    fuelTypeFilter,
    sortBy,
    hasDriverFilter,
  ]);

  const isLoading = trucksLoading || stationsLoading;
  const error = trucksError || stationsError;

  const handleGetRecommendations = () => {
    setShowRecommendations(true);
    refetchRecommendations();
  };

  const handleViewDetails = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  const handleDispatchRecommendation = (recommendation) => {
    setDispatchError(null);
    setDispatchingRecommendation(recommendation);

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

  const handleExecuteDispatch = async () => {
    if (!dispatchResult) return;

    setExecutingDispatch(true);
    setDispatchError(null);

    try {
      const stationIds = (dispatchResult.route_stops || [])
        .map((s) => s.station_code || s.code || s.station_id)
        .filter((id) => id !== null && id !== undefined)
        .map((id) => String(id));

      if (stationIds.length === 0) {
        throw new Error("No stations found in dispatch plan");
      }

      const requestData = {
        truck_id: dispatchResult.truck_code,
        station_ids: stationIds,
        depot_location: depotLocation,
        estimated_distance_km: dispatchResult.total_distance_km,
        estimated_duration_minutes: dispatchResult.estimated_duration_hours
          ? Math.round(dispatchResult.estimated_duration_hours * 60)
          : null,
        notes: `AI-optimized dispatch created by ${
          dispatchResult.requested_by || "system"
        }`,
      };

      const response = await executeDispatch(requestData);

      setExecutionResult(response);
      setExecutingDispatch(false);

      alert(
        `✅ Dispatch executed successfully!\n\n` +
          `Truck: ${response.truck_code}\n` +
          `Driver: ${response.driver_name || "No driver assigned"}\n` +
          `Deliveries: ${response.deliveries_created}\n` +
          `Total Volume: ${response.total_volume_liters?.toLocaleString()} L\n\n` +
          `Status: ${response.status}`
      );

      setDispatchResult(null);
    } catch (error) {
      console.error("Execute dispatch error:", error);

      let errorMessage = "Unknown error";
      const errorDetail = error?.data?.detail || error?.response?.data?.detail;

      if (errorDetail) {
        if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail
            .map((err) => `${err.loc?.join(".") || "field"}: ${err.msg}`)
            .join(", ");
        } else if (typeof errorDetail === "string") {
          errorMessage = errorDetail;
        } else {
          errorMessage = JSON.stringify(errorDetail);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setExecutingDispatch(false);
      setDispatchError(errorMessage);
      alert(`❌ Failed to execute dispatch: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dispatcher data..." />;
  }

  return (
    <PageLayout maxWidth="full">
      {/* HEADER + SETTINGS + FILTER BAR */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                AI-Powered Dispatch Center
              </h1>
            </div>
            <p className="text-sm sm:text-base text-slate-300">
              Let AI optimize your entire fleet dispatch strategy in seconds
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors self-start sm:self-auto bg-slate-900 text-slate-100"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 bg-slate-900/70 backdrop-blur rounded-lg border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">
              Dispatch Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="depotLocation"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Depot Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="depotLocation"
                    value={depotLocation}
                    onChange={(e) => setDepotLocation(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-600 rounded-lg bg-slate-950 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter depot location"
                  />
                  <MapPinIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div>
                <label
                  htmlFor="llmModel"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  AI Model
                </label>
                <select
                  id="llmModel"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-950 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Region/City Filter Bar */}
        <div className="mt-4 bg-slate-900/70 backdrop-blur rounded-lg border border-purple-500/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Filter by Region or City
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs text-purple-300 hover:text-purple-100 transition-colors"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="filterRegion"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Region (Province/State)
                </label>
                <select
                  id="filterRegion"
                  value={filterRegion}
                  onChange={(e) => {
                    setFilterRegion(e.target.value);
                    setFilterCity("");
                  }}
                  className="w-full px-4 py-2 border border-purple-500/40 rounded-lg bg-slate-950 text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  City
                </label>
                <select
                  id="filterCity"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-500/40 rounded-lg bg-slate-950 text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-purple-400 text-purple-100 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {(filterRegion || filterCity) && (
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <span className="text-slate-300">Active filters:</span>
              {filterRegion && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-100 rounded-full text-xs font-medium">
                  Region: {filterRegion}
                </span>
              )}
              {filterCity && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-100 rounded-full text-xs font-medium">
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

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <div className="bg-slate-900/80 rounded-lg shadow p-4 sm:p-6 border border-slate-700">
          <div className="text-xs sm:text-sm font-medium text-slate-300">
            Active Trucks
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-emerald-400">
            {activeTrucks.length}
          </div>
        </div>
        <div className="bg-slate-900/80 rounded-lg shadow p-4 sm:p-6 border border-slate-700">
          <div className="text-xs sm:text-sm font-medium text-slate-300">
            Stations Needing Fuel
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-orange-400">
            {stationsNeedingFuel.length}
          </div>
        </div>
        <div className="bg-slate-900/80 rounded-lg shadow p-4 sm:p-6 border border-amber-500/70">
          <div className="text-xs sm:text-sm font-medium text-slate-300 flex items-center">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-400 mr-1" />
            High Priority Stations
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-amber-300">
            {highPriorityStations.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">20–30% fuel</div>
        </div>
        <div className="bg-slate-900/80 rounded-lg shadow p-4 sm:p-6 border border-slate-700">
          <div className="text-xs sm:text-sm font-medium text-slate-300">
            IoT Auto-Requests
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-blue-400">
            {
              stationsNeedingFuel.filter(
                (s) => s.request_method === REQUEST_METHODS.IOT
              ).length
            }
          </div>
        </div>
      </div>

      {/* MAIN CTA */}
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
              className="px-6 py-3 bg-slate-950 text-blue-200 rounded-lg hover:bg-slate-900 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

      {/* DISPATCH RESULT + EXECUTE */}
      {dispatchResult && (
        <div className="mb-6">
          <DispatchResultCard
            result={dispatchResult}
            onClose={() => {
              setDispatchResult(null);
            }}
          />

          <div className="mt-4 bg-emerald-900/40 border-2 border-emerald-500/60 rounded-lg p-6">
            <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-100 mb-2 flex items-center">
                  <TruckIcon className="w-5 h-5 mr-2 text-emerald-300" />
                  Ready to Execute Dispatch
                </h3>
                <p className="text-sm text-emerald-100/90 mb-2">
                  This will create actual delivery records in the system and
                  update the truck status to &quot;Active&quot;.
                </p>
                <ul className="text-xs text-emerald-100/80 space-y-1 mb-4">
                  <li>
                    ✓ Creates delivery records for all{" "}
                    {dispatchResult.route_stops?.length || 0} stations
                  </li>
                  <li>✓ Assigns the driver to these deliveries</li>
                  <li>✓ Updates truck status to &quot;Active&quot;</li>
                  <li>✓ Locks the truck from other dispatches</li>
                  <li>✓ Starts tracking delivery progress</li>
                </ul>
                {dispatchResult.driver_name ? (
                  <div className="text-sm text-emerald-100">
                    <strong>Driver:</strong> {dispatchResult.driver_name}
                  </div>
                ) : (
                  <div className="text-sm text-amber-200 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    <strong>Warning:</strong> No driver assigned to this truck
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExecuteDispatch}
                  disabled={executingDispatch}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 min-w-[180px] ${
                    executingDispatch
                      ? "bg-slate-500 text-slate-200 cursor-not-allowed"
                      : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 hover:shadow-lg"
                  }`}
                >
                  {executingDispatch ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <TruckIcon className="w-5 h-5" />
                      <span>Execute Dispatch</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDispatchResult(null)}
                  className="px-6 py-2 text-sm text-slate-200 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTION RESULT */}
      {executionResult && (
        <div className="mb-6 bg-emerald-900/40 border-2 border-emerald-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-emerald-100 flex items-center">
              <TruckIcon className="w-6 h-6 text-emerald-300 mr-2" />
              Dispatch Executed Successfully
            </h2>
            <button
              onClick={() => setExecutionResult(null)}
              className="text-slate-300 hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-slate-100">
            <div>
              <div className="text-sm text-slate-300">Truck</div>
              <div className="font-semibold">
                {executionResult.truck_code} ({executionResult.truck_plate})
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-300">Driver</div>
              <div className="font-semibold">
                {executionResult.driver_name || "No driver assigned"}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-300">Deliveries Created</div>
              <div className="font-semibold">
                {executionResult.deliveries_created} stations
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-300">Total Volume</div>
              <div className="font-semibold">
                {executionResult.total_volume_liters?.toLocaleString()} L
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 rounded-lg p-4 mb-4">
            <div className="text-sm font-medium text-slate-100 mb-2">
              Delivery Stops:
            </div>
            <div className="space-y-1 text-slate-100">
              {executionResult.deliveries?.map((delivery, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {idx + 1}. {delivery.station_name} (
                    {delivery.station_code})
                  </span>
                  <span>
                    {delivery.volume_liters?.toLocaleString()} L
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-emerald-100">
            <strong>Status:</strong> {executionResult.status} • Departure:{" "}
            {new Date(executionResult.departure_time).toLocaleString()}
          </div>
        </div>
      )}

      {/* DISPATCH ERROR */}
      {dispatchError && (
        <div className="mb-6">
          <ErrorMessage
            message={`Dispatch failed: ${dispatchError}`}
            onDismiss={() => setDispatchError(null)}
          />
        </div>
      )}

      {/* AI RECOMMENDATIONS SECTION */}
      {showRecommendations && !dispatchResult && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center">
              <SparklesIcon className="w-6 h-6 text-blue-400 mr-2" />
              AI Dispatch Recommendations
            </h2>
            <button
              onClick={() => setShowRecommendations(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
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

              {recommendationsData.summary && (
                <div className="mb-6 bg-blue-900/40 border border-blue-500/60 rounded-lg p-4 my-4">
                  <h3 className="text-sm font-semibold text-blue-100 mb-2">
                    Executive Summary
                  </h3>
                  <p className="text-sm text-blue-100/90">
                    {recommendationsData.summary}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-slate-900/60 rounded-lg text-slate-200">
              <p>
                No recommendations available. All stations may be adequately
                fueled or no trucks are available.
              </p>
            </div>
          )}
        </div>
      )}

      {/* QUICK REFERENCE SECTION */}
      {!showRecommendations && !dispatchResult && (
        <div
          className={
            "grid grid-cols-1 gap-6 " +
            (hasCriticalStations ? "lg:grid-cols-2" : "")
          }
        >
          {/* Critical Stations (only when we actually have some) */}
          {hasCriticalStations && (
            <div className="bg-slate-900/80 rounded-lg shadow p-6 border-2 border-red-500/70">
              <h3 className="text-lg font-bold text-red-200 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Critical Stations ({criticalStations.length})
              </h3>
              <div className="space-y-3">
                {criticalStations.slice(0, 5).map((station) => (
                  <div
                    key={station.station_id}
                    className="flex items-center justify-between p-3 bg-red-900/40 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-slate-100">
                        {station.name}
                      </div>
                      <div className="text-xs text-slate-300">
                        {station.city} • {station.fuel_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-200">
                        {station.fuel_level_percent}%
                      </div>
                      <div className="text-xs text-slate-300">fuel level</div>
                    </div>
                  </div>
                ))}
                {criticalStations.length > 5 && (
                  <div className="text-sm text-slate-300 text-center">
                    +{criticalStations.length - 5} more critical stations
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Fleet */}
          <div className="bg-slate-900/80 rounded-lg shadow p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center">
                <TruckIcon className="w-5 h-5 mr-2 text-blue-400" />
                Available Fleet ({filteredAndSortedTrucks.length})
              </h3>
              <button
                onClick={() => setShowFleetFilters(!showFleetFilters)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors text-slate-100"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    showFleetFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Search + filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by code, plate, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg bg-slate-950 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {showFleetFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-950/70 rounded-lg border border-slate-700">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      {Object.values(TRUCK_STATUS).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={fuelTypeFilter}
                      onChange={(e) => setFuelTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Fuel Types</option>
                      <option value="diesel">Diesel</option>
                      <option value="regular">Regular</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Driver
                    </label>
                    <select
                      value={hasDriverFilter}
                      onChange={(e) => setHasDriverFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Trucks</option>
                      <option value="assigned">Has Driver</option>
                      <option value="unassigned">No Driver</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-900 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="code">Truck Code</option>
                      <option value="fuel_level">Fuel Level</option>
                      <option value="capacity">Total Capacity</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Truck List */}
            {filteredAndSortedTrucks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <TruckIcon className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p>No trucks found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredAndSortedTrucks.map((truck) => (
                  <TruckDispatchCard
                    key={truck.truck_id}
                    truck={truck}
                    isExpanded={expandedTruckId === truck.truck_id}
                    onToggleExpand={() =>
                      setExpandedTruckId(
                        expandedTruckId === truck.truck_id
                          ? null
                          : truck.truck_id
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECOMMENDATION DETAILS MODAL */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-100 flex items-center">
                  <SparklesIcon className="w-6 h-6 text-blue-400 mr-2" />
                  Dispatch Recommendation Details
                </h2>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-slate-100">
                <div className="bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Assignment</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-300 text-xs">Truck</span>
                      <div className="font-medium">
                        {selectedRecommendation.truck_code}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-300 text-xs">Priority</span>
                      <div className="font-medium">
                        {selectedRecommendation.priority}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Route Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-300 text-xs">Stations</span>
                      <div className="font-medium">
                        {selectedRecommendation.station_count}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-300 text-xs">Distance</span>
                      <div className="font-medium">
                        {selectedRecommendation.total_distance}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-300 text-xs">Duration</span>
                      <div className="font-medium">
                        {selectedRecommendation.estimated_duration}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-300 text-xs">
                        Fuel Delivery
                      </span>
                      <div className="font-medium">
                        {selectedRecommendation.total_fuel_delivery}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRecommendation.route_summary && (
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Route Summary</h3>
                    <p className="text-sm text-slate-100/90">
                      {selectedRecommendation.route_summary}
                    </p>
                  </div>
                )}

                {selectedRecommendation.rationale && (
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">AI Rationale</h3>
                    <p className="text-sm text-slate-100/90">
                      {selectedRecommendation.rationale}
                    </p>
                  </div>
                )}

                {selectedRecommendation.stations &&
                  selectedRecommendation.stations.length > 0 && (
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        Stations to Visit
                      </h3>
                      <div className="space-y-2">
                        {selectedRecommendation.stations.map(
                          (station, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0 text-sm"
                            >
                              <div>
                                <div className="font-medium">
                                  {station.name}
                                </div>
                                <div className="text-slate-300 text-xs">
                                  {station.city}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {station.fuel_level_percent}% fuel
                                </div>
                                <div className="text-slate-300 text-xs">
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

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDispatchRecommendation(selectedRecommendation);
                  }}
                  disabled={dispatchingRecommendation === selectedRecommendation}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    dispatchingRecommendation === selectedRecommendation
                      ? "bg-slate-500 text-slate-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-500"
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
    </PageLayout>
  );
}

export default ImprovedDispatcherPage;
