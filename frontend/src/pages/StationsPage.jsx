import { useState, useMemo, useEffect } from "react";
import DynamicTable from "../components/DynamicTable";
import PageLayout from "../components/PageLayout";
import LoadingState from "../components/LoadingState";
import { useStations } from "../hooks/useStationQueries";

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
      // Calculate priority based on fuel level
      priority:
        station.fuel_level < 30
          ? "High"
          : station.fuel_level < 60
          ? "Medium"
          : "Low",
      last_delivery: "N/A", // Backend doesn't provide this yet
    }));
  }, [data]);

  const [filteredStations, setFilteredStations] = useState([]);

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
      render: (value) => {
        const priorityColors = {
          High: "bg-red-100 text-red-800",
          Medium: "bg-yellow-100 text-yellow-800",
          Low: "bg-green-100 text-green-800",
        };
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[value]}`}
          >
            {value}
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

  // Update filteredStations when stations change
  useEffect(() => {
    setFilteredStations(stations);
  }, [stations]);

  const handleFilter = () => {
    console.log("Open filter modal");
    // TODO: Implement filter modal
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    High Priority Stations
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
                    Low Fuel Stations
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.filter((s) => s.fuel_level < 30).length}
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
                    Well Stocked Stations
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {stations.filter((s) => s.fuel_level >= 70).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stations Table */}
        <DynamicTable
          data={filteredStations}
          columns={columns}
          onFilter={handleFilter}
          showFilters={true}
        />
      </div>
    </PageLayout>
  );
}

export default StationsPage;
