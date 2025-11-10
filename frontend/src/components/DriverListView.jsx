import { useState, useMemo } from "react";
import DriverCard from "./DriverCard";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

function DriverListView({ drivers, onSelectDriver, showSelection = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [hazmatOnly, setHazmatOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("name");

  // Filter and sort drivers
  const filteredAndSortedDrivers = useMemo(() => {
    let filtered = [...drivers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          driver.full_name?.toLowerCase().includes(query) ||
          driver.employee_id?.toLowerCase().includes(query) ||
          driver.email?.toLowerCase().includes(query) ||
          driver.current_location?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((driver) => driver.status === statusFilter);
    }

    // Available only
    if (availableOnly) {
      filtered = filtered.filter((driver) => driver.is_available);
    }

    // HazMat certified only
    if (hazmatOnly) {
      filtered = filtered.filter((driver) => driver.hazmat_certified);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.full_name || "").localeCompare(b.full_name || "");
        case "hours_remaining":
          return (
            (b.hours_remaining_today || 0) - (a.hours_remaining_today || 0)
          );
        case "experience":
          return (b.years_experience || 0) - (a.years_experience || 0);
        case "employee_id":
          return (a.employee_id || "").localeCompare(b.employee_id || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [drivers, searchQuery, statusFilter, availableOnly, hazmatOnly, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: drivers.length,
      available: drivers.filter((d) => d.is_available).length,
      active: drivers.filter((d) => d.status === "active").length,
      hazmat: drivers.filter((d) => d.hazmat_certified).length,
    };
  }, [drivers]);

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Drivers</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg shadow border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {stats.available}
          </div>
          <div className="text-xs text-green-700">Available Now</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg shadow border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          <div className="text-xs text-blue-700">Active Status</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg shadow border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {stats.hazmat}
          </div>
          <div className="text-xs text-orange-700">HazMat Certified</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
            Driver Management
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, email, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="name">Name</option>
                <option value="employee_id">Employee ID</option>
                <option value="hours_remaining">Hours Remaining</option>
                <option value="experience">Experience</option>
              </select>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Available Only</span>
              </label>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hazmatOnly}
                  onChange={(e) => setHazmatOnly(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">HazMat Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-500 mt-3">
          Showing {filteredAndSortedDrivers.length} of {drivers.length} drivers
        </div>
      </div>

      {/* Driver List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedDrivers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              No drivers found matching your criteria
            </p>
          </div>
        ) : (
          filteredAndSortedDrivers.map((driver) => (
            <DriverCard
              key={driver.driver_id}
              driver={driver}
              onSelect={showSelection ? onSelectDriver : null}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DriverListView;
