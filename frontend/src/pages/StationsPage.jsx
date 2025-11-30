import { useState, useMemo, useEffect } from "react";
import DynamicTable from "../components/DynamicTable";
import PageLayout from "../components/PageLayout";
import LoadingState from "../components/LoadingState";
import { useStations } from "../hooks/useStationQueries";
import { FUEL_THRESHOLDS } from "../constants/config";
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from "@heroicons/react/24/outline";

function StationsPage() {
  const { data, isPending, error } = useStations();
  const stations = useMemo(() => {
    if (!data?.stations) return [];

    // Transform API data to match table expectations
    return data.stations.map((station) => ({
      ...station,
      id: station.station_id,
      fuel_type: station.fuel_type
        ? station.fuel_type.charAt(0).toUpperCase() + station.fuel_type.slice(1)
        : "Diesel",
      // Calculate priority based on fuel level (same logic as DispatcherPage)
      priority:
        station.fuel_level < FUEL_THRESHOLDS.CRITICAL
          ? "Critical"
          : station.fuel_level < FUEL_THRESHOLDS.HIGH
          ? "High"
          : station.fuel_level < FUEL_THRESHOLDS.MEDIUM
          ? "Medium"
          : "Low",
      // Mark stations that need attention (same as DispatcherPage filter)
      needsAttention: station.needs_refuel || station.fuel_level < FUEL_THRESHOLDS.HIGH,
      last_delivery: "N/A", // Backend doesn't provide this yet
    }));
  }, [data]);

  const [filteredStations, setFilteredStations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: [],
    fuelType: [],
    needsAttention: false,
    search: "",
    deliveryDateRange: {
      from: "",
      to: "",
    },
  });

  // Column configuration for the stations table
  const columns = [
    {
      key: "name",
      label: "Station Name",
      sortable: true,
    },
    {
      key: "fuel_type",
      label: "Fuel Type",
      sortable: true,
      render: (value) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: "fuel_level",
      label: "Fuel Level",
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                value >= 70
                  ? "bg-green-500"
                  : value >= 30
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (value, station) => {
        const priorityColors = {
          Critical: "bg-red-100 text-red-800 ring-1 ring-red-600",
          High: "bg-orange-100 text-orange-800",
          Medium: "bg-yellow-100 text-yellow-800",
          Low: "bg-green-100 text-green-800",
        };
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              priorityColors[value] || priorityColors.Low
            }`}
          >
            {value}
            {station.needsAttention && value === "Critical" && " ⚠️"}
          </span>
        );
      },
    },
    {
      key: "city",
      label: "Location",
      sortable: true,
    },
    {
      key: "last_delivery",
      label: "Last Delivery",
      sortable: true,
    },
  ];

  // Update filteredStations when stations or filters change
  useEffect(() => {
    let filtered = [...stations];

    // Apply priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(station => filters.priority.includes(station.priority));
    }

    // Apply fuel type filter
    if (filters.fuelType.length > 0) {
      filtered = filtered.filter(station => filters.fuelType.includes(station.fuel_type));
    }

    // Apply needs attention filter
    if (filters.needsAttention) {
      filtered = filtered.filter(station => station.needsAttention);
    }

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchTerm) ||
        station.city.toLowerCase().includes(searchTerm) ||
        station.region.toLowerCase().includes(searchTerm)
      );
    }

    // Apply delivery date range filter
    if (filters.deliveryDateRange.from || filters.deliveryDateRange.to) {
      filtered = filtered.filter(station => {
        // For now, since backend doesn't provide actual dates, we'll simulate
        // In real implementation, this would filter by actual last_delivery dates
        if (!station.last_delivery || station.last_delivery === "N/A") {
          return false; // Exclude stations with no delivery date
        }
        
        const deliveryDate = new Date(station.last_delivery);
        const fromDate = filters.deliveryDateRange.from ? new Date(filters.deliveryDateRange.from) : null;
        const toDate = filters.deliveryDateRange.to ? new Date(filters.deliveryDateRange.to) : null;
        
        if (fromDate && deliveryDate < fromDate) return false;
        if (toDate && deliveryDate > toDate) return false;
        
        return true;
      });
    }

    setFilteredStations(filtered);
  }, [stations, filters]);

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setFilters({
      priority: [],
      fuelType: [],
      needsAttention: false,
      search: "",
      deliveryDateRange: {
        from: "",
        to: "",
      },
    });
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  // Get unique fuel types for filter options
  const fuelTypes = [...new Set(stations.map(s => s.fuel_type))];
  const priorities = ["Critical", "High", "Medium", "Low"];
  const activeFilterCount = filters.priority.length + filters.fuelType.length + 
    (filters.needsAttention ? 1 : 0) + (filters.search.trim() ? 1 : 0) +
    (filters.deliveryDateRange.from || filters.deliveryDateRange.to ? 1 : 0);

  if (isPending) {
    return <LoadingState message="Loading stations..." fullPage={true} />;
  }

  if (error) {
    return (
      <PageLayout background={true} fullHeight={true}>
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-8">
          <div className="flex items-center justify-center space-x-3">
            <span className="text-red-600 text-lg">⚠</span>
            <span className="text-red-800">
              {error.message || "Failed to load stations"}
            </span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout background={true} fullHeight={true}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-lg">⛽</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Total Stations
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-lg">!</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Critical Priority
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.filter((s) => s.priority === "Critical").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-bold text-lg">⚠</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    High Priority
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.filter((s) => s.priority === "High").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 font-bold text-lg">⚠</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Medium Priority
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.filter((s) => s.priority === "Medium").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Low Priority
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.filter((s) => s.priority === "Low").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <div className="flex items-center space-x-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all ({activeFilterCount})
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Stations
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Station name, city..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <div className="space-y-2">
                  {priorities.map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(priority)}
                        onChange={() => toggleFilter('priority', priority)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fuel Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type
                </label>
                <div className="space-y-2">
                  {fuelTypes.map(fuelType => (
                    <label key={fuelType} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.fuelType.includes(fuelType)}
                        onChange={() => toggleFilter('fuelType', fuelType)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{fuelType}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Filters
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.needsAttention}
                      onChange={(e) => setFilters(prev => ({ ...prev, needsAttention: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Needs Attention</span>
                  </label>
                </div>
              </div>

              {/* Delivery Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Delivery Date
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.deliveryDateRange.from}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        deliveryDateRange: { ...prev.deliveryDateRange, from: e.target.value }
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.deliveryDateRange.to}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        deliveryDateRange: { ...prev.deliveryDateRange, to: e.target.value }
                      }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stations Table */}
        <DynamicTable
          data={filteredStations}
          columns={columns}
          onFilter={handleFilter}
          showFilters={true}
          rowClassName={(station) => 
            station.needsAttention ? "bg-red-50 border-l-4 border-red-400" : ""
          }
        />
      </div>
    </PageLayout>
  );
}

export default StationsPage;
