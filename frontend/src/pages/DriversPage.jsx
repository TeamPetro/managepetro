import { useState } from "react";
import { useDrivers } from "../hooks/useDriverQueries";
import DriverListView from "../components/DriverListView";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PageLayout from "../components/PageLayout";
import { UsersIcon } from "@heroicons/react/24/outline";

function DriversPage() {
  const [selectedDriver, setSelectedDriver] = useState(null);

  const { data, isPending, error } = useDrivers();

  if (isPending) {
    return (
      <PageLayout title="Driver Management">
        <LoadingSpinner />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Driver Management">
        <ErrorMessage error={error} />
      </PageLayout>
    );
  }

  const drivers = data?.drivers || [];

  return (
    <PageLayout
      title="Driver Management"
      subtitle="Manage your fleet drivers and track their availability"
      icon={UsersIcon}
    >
      <div className="space-y-6">
        {/* Driver List */}
        <DriverListView
          drivers={drivers}
          onDriverSelect={(driver) => setSelectedDriver(driver)}
        />

        {/* Selected Driver Details (Optional) */}
        {selectedDriver && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Driver
            </h3>
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(selectedDriver, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default DriversPage;
