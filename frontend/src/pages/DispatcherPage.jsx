import { useState, useMemo } from "react";
import { useTrucks } from "../hooks/useTruckQueries";
import { useStations } from "../hooks/useStationQueries";
import { useOptimizeDispatch } from "../hooks/useDispatchQueries";
import LoadingState from "../components/LoadingState";
import ErrorMessage from "../components/ErrorMessage";
import AIErrorMessage from "../components/AIErrorMessage";
import TruckDispatchCard from "../components/TruckDispatchCard";
import StationNeedsCard from "../components/StationNeedsCard";
import DispatchResultCard from "../components/DispatchResultCard";
import PageLayout from "../components/PageLayout";
import {
  TruckIcon,
  MapPinIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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

function DispatcherPage() {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [depotLocation, setDepotLocation] = useState(DEFAULT_DEPOT_LOCATION);
  const [llmModel, setLlmModel] = useState(DEFAULT_LLM_MODEL);
  const [dispatchError, setDispatchError] = useState(null);

  // Fleet filtering and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("code"); // code, fuel_level, capacity
  const [showFilters, setShowFilters] = useState(false);
  const [expandedTruckId, setExpandedTruckId] = useState(null);

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
  const optimizeDispatchMutation = useOptimizeDispatch();

  const trucks = useMemo(() => trucksData?.trucks || [], [trucksData]);
  const stations = useMemo(() => {
    if (!stationsData?.stations) return [];
    // Filter stations that need refuelling based on defined threshold
    return stationsData.stations.filter(
      (station) =>
        station.needs_refuel || station.fuel_level < FUEL_THRESHOLDS.HIGH
    );
  }, [stationsData]);

  // Filtered and sorted trucks
  const filteredTrucks = useMemo(() => {
    let result = [...trucks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (truck) =>
          truck.code?.toLowerCase().includes(query) ||
          truck.plate_number?.toLowerCase().includes(query) ||
          truck.fuel_type?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((truck) => truck.status === statusFilter);
    }

    // Apply fuel type filter
    if (fuelTypeFilter !== "all") {
      result = result.filter((truck) => truck.fuel_type === fuelTypeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "fuel_level":
          return b.fuel_level_percent - a.fuel_level_percent;
        case "capacity":
          return b.capacity_liters - a.capacity_liters;
        case "code":
        default:
          return a.code?.localeCompare(b.code);
      }
    });

    return result;
  }, [trucks, searchQuery, statusFilter, fuelTypeFilter, sortBy]);

  // Get unique fuel types for filter
  const uniqueFuelTypes = useMemo(() => {
    return [...new Set(trucks.map((t) => t.fuel_type).filter(Boolean))];
  }, [trucks]);

  const isLoading = trucksLoading || stationsLoading;
  const error = trucksError || stationsError;

  const handleOptimizeDispatch = async (truck) => {
    setSelectedTruck(truck);
    setDispatchError(null); // Clear any previous errors

    optimizeDispatchMutation.mutate(
      {
        truck_id: truck.truck_id,
        depot_location: depotLocation,
        llm_model: llmModel,
      },
      {
        onSuccess: (result) => {
          // Transform the API response for consistent frontend consumption
          const transformedResult = Api.transformDispatchResponse(result);
          setDispatchResult(transformedResult);
        },
        onError: (error) => {
          setDispatchResult(null);
          setDispatchError(error?.message || "AI dispatch optimization failed");
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
              <TruckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dispatcher Dashboard
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Optimize truck dispatches to stations requiring fuel delivery
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
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error.message || "Failed to load data"} />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            Available Trucks
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
            {trucks.filter((t) => t.status === TRUCK_STATUS.ACTIVE).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            Stations Needing Fuel
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-orange-600">
            {stations.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">
            IoT Auto-Requests
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-semibold text-blue-600">
            {
              stations.filter((s) => s.request_method === REQUEST_METHODS.IOT)
                .length
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Column: Trucks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Available Fleet ({filteredTrucks.length} of {trucks.length})
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
              {showFilters ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code, plate number, or fuel type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-3 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value={TRUCK_STATUS.ACTIVE}>Active</option>
                      <option value={TRUCK_STATUS.MAINTENANCE}>
                        Maintenance
                      </option>
                      <option value={TRUCK_STATUS.OFFLINE}>Offline</option>
                    </select>
                  </div>

                  {/* Fuel Type Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={fuelTypeFilter}
                      onChange={(e) => setFuelTypeFilter(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      {uniqueFuelTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="code">Truck Code</option>
                      <option value="fuel_level">Fuel Level</option>
                      <option value="capacity">Capacity</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchQuery ||
                  statusFilter !== "all" ||
                  fuelTypeFilter !== "all" ||
                  sortBy !== "code") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setFuelTypeFilter("all");
                      setSortBy("code");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trucks List */}
          <div className="space-y-4">
            {filteredTrucks.length > 0 ? (
              filteredTrucks.map((truck) => (
                <TruckDispatchCard
                  key={truck.truck_id}
                  truck={truck}
                  onOptimize={handleOptimizeDispatch}
                  isOptimizing={
                    optimizeDispatchMutation.isPending &&
                    selectedTruck?.truck_id === truck.truck_id
                  }
                  disabled={optimizeDispatchMutation.isPending}
                  isExpanded={expandedTruckId === truck.truck_id}
                  onToggleExpand={() =>
                    setExpandedTruckId(
                      expandedTruckId === truck.truck_id ? null : truck.truck_id
                    )
                  }
                />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No trucks match your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setFuelTypeFilter("all");
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stations or Dispatch Result */}
        <div>
          {dispatchError && (
            <div className="mb-4">
              <AIErrorMessage
                message={dispatchError}
                context="dispatch"
                onRetry={() =>
                  selectedTruck && handleOptimizeDispatch(selectedTruck)
                }
                onDismiss={() => setDispatchError(null)}
              />
            </div>
          )}

          {dispatchResult ? (
            <DispatchResultCard
              result={dispatchResult}
              onClose={() => {
                setDispatchResult(null);
                setSelectedTruck(null);
              }}
            />
          ) : (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                Stations Requiring Fuel ({stations.length})
              </h2>
              <div className="space-y-4">
                {stations.map((station) => (
                  <StationNeedsCard
                    key={station.station_id}
                    station={station}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default DispatcherPage;
