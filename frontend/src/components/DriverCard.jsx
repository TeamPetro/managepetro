import {
  UserCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

function DriverCard({ driver, compact = false, onSelect }) {
  // Determine availability color
  const getAvailabilityColor = () => {
    if (!driver.is_available) return "bg-red-100 text-red-800";
    if (driver.hours_remaining_today < 2)
      return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Determine hours color
  const getHoursColor = () => {
    if (driver.hours_remaining_today < 2) return "text-red-600";
    if (driver.hours_remaining_today < 4) return "text-yellow-600";
    return "text-green-600";
  };

  if (compact) {
    return (
      <div
        onClick={() => onSelect && onSelect(driver)}
        className={`p-3 bg-white border border-gray-200 rounded-lg ${
          onSelect ? "cursor-pointer hover:shadow-md transition-shadow" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserCircleIcon className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {driver.full_name}
              </h4>
              <p className="text-xs text-gray-500">{driver.employee_id}</p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor()}`}
            >
              {driver.is_available ? "Available" : "Unavailable"}
            </span>
            {driver.hours_remaining_today !== undefined && (
              <p className={`text-xs font-medium mt-1 ${getHoursColor()}`}>
                {driver.hours_remaining_today.toFixed(1)}h left
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserCircleIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {driver.full_name}
              </h3>
              <p className="text-sm text-gray-500">{driver.employee_id}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getAvailabilityColor()}`}
          >
            {driver.status}
          </span>
        </div>

        {/* Certifications & Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {driver.hazmat_certified && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
              <CheckBadgeIcon className="w-3 h-3 mr-1" />
              HazMat
            </span>
          )}
          {driver.tanker_endorsement && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              <CheckBadgeIcon className="w-3 h-3 mr-1" />
              Tanker
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            Class {driver.license_class}
          </span>
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            <BriefcaseIcon className="w-3 h-3 mr-1" />
            {driver.years_experience} yrs
          </span>
        </div>

        {/* Hours Information */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <ClockIcon className="w-4 h-4 mr-1" />
              Today
            </div>
            <div className={`text-lg font-bold ${getHoursColor()}`}>
              {driver.hours_remaining_today?.toFixed(1) || "0"}h
            </div>
            <div className="text-xs text-gray-500">remaining</div>
          </div>
          <div>
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <CalendarIcon className="w-4 h-4 mr-1" />
              This Week
            </div>
            <div className="text-lg font-bold text-gray-900">
              {driver.weekly_hours?.toFixed(1) || "0"}h
            </div>
            <div className="text-xs text-gray-500">worked</div>
          </div>
        </div>

        {/* Location & Assignment */}
        <div className="space-y-2 mb-4">
          {driver.current_location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span>{driver.current_location}</span>
            </div>
          )}
          {driver.assigned_truck_code && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium text-gray-900 mr-2">
                Assigned Truck:
              </span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                {driver.assigned_truck_code}
              </span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        {(driver.phone || driver.email) && (
          <div className="border-t border-gray-200 pt-3 space-y-1">
            {driver.phone && (
              <p className="text-xs text-gray-500">📞 {driver.phone}</p>
            )}
            {driver.email && (
              <p className="text-xs text-gray-500">📧 {driver.email}</p>
            )}
          </div>
        )}

        {/* Certification Status Warning */}
        {!driver.is_available &&
          driver.certification_status !== "✓ All Current" && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  {driver.certification_status}
                </p>
              </div>
            </div>
          )}

        {/* Action Button */}
        {onSelect && driver.is_available && (
          <button
            onClick={() => onSelect(driver)}
            className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Select Driver
          </button>
        )}
      </div>
    </div>
  );
}

export default DriverCard;
