import { MapPinIcon } from "@heroicons/react/24/outline";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import ListItem from "./ListItem";
import Icon from "./Icon";

function FuelStationsCard({ fuelStations }) {
  // Filter stations to only show those with valid location data (city or region)
  const validStations =
    fuelStations?.filter((station) => station.city || station.region) || [];

  if (validStations.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Nearby Fuel Stations
        </h3>
        <StatusBadge variant="primary">
          {validStations.length} stations
        </StatusBadge>
      </div>

      <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
        {validStations.map((station, index) => (
          <ListItem
            key={station.station_id || index}
            icon={
              <Icon>
                <MapPinIcon className="text-blue-500" />
              </Icon>
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  {station.name || "Unnamed Station"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {station.city && station.region
                    ? `${station.city}, ${station.region}`
                    : station.city || station.region}
                </p>
              </div>
              {station.fuel_level !== undefined && (
                <StatusBadge
                  variant={
                    station.fuel_level >= 70
                      ? "success"
                      : station.fuel_level >= 40
                      ? "warning"
                      : "danger"
                  }
                  className="ml-2 flex-shrink-0"
                >
                  {station.fuel_level}%
                </StatusBadge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {station.fuel_type && (
                <StatusBadge variant="outline" className="text-xs px-2 py-0.5">
                  {station.fuel_type}
                </StatusBadge>
              )}
              {station.capacity_liters && (
                <span className="text-gray-500">
                  Capacity: {station.capacity_liters.toLocaleString()}L
                </span>
              )}
              {station.current_level_liters !== undefined && (
                <span className="text-gray-500">
                  Current: {station.current_level_liters.toLocaleString()}L
                </span>
              )}
            </div>
          </ListItem>
        ))}
      </div>
    </Card>
  );
}

export default FuelStationsCard;
