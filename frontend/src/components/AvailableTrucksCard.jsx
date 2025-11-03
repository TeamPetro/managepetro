import { TruckIcon } from "@heroicons/react/24/outline";

import Card from "./Card";
import Icon from "./Icon";
import ListItem from "./ListItem";
import StatusBadge from "./StatusBadge";
import { TRUCK_STATUS } from "../constants/config";

function AvailableTrucksCard({ trucks }) {
  // Filter trucks to only show those with valid plate_number or truck_id
  const validTrucks =
    trucks?.filter((truck) => truck.plate_number || truck.truck_id) || [];

  if (validTrucks.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Available Trucks
        </h3>
        <StatusBadge variant="success">
          {validTrucks.length} available
        </StatusBadge>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {validTrucks.map((truck, index) => (
          <ListItem
            key={truck.truck_id || index}
            icon={
              <Icon>
                <TruckIcon className="text-green-500" />
              </Icon>
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  {truck.plate_number || truck.truck_id}
                </p>
                {truck.code && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {truck.code}
                  </p>
                )}
              </div>
              {truck.status && (
                <StatusBadge
                  variant={
                    truck.status === TRUCK_STATUS.ACTIVE
                      ? "success"
                      : truck.status === TRUCK_STATUS.MAINTENANCE
                      ? "warning"
                      : "default"
                  }
                  className="ml-2 flex-shrink-0"
                >
                  {truck.status}
                </StatusBadge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {truck.fuel_type && (
                <StatusBadge variant="outline" className="text-xs px-2 py-0.5">
                  {truck.fuel_type}
                </StatusBadge>
              )}
              {truck.capacity_liters && (
                <span className="text-gray-500">
                  Capacity: {truck.capacity_liters.toLocaleString()}L
                </span>
              )}
              {truck.fuel_level_percent !== undefined && (
                <span className="text-gray-500">
                  Fuel: {truck.fuel_level_percent}%
                </span>
              )}
            </div>
          </ListItem>
        ))}
      </div>
    </Card>
  );
}

export default AvailableTrucksCard;
