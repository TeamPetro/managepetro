import RouteForm from "../components/RouteForm";
import ActionButtons from "../components/ActionButtons";
import ETADisplay from "../components/ETADisplay";
import InstructionsList from "../components/InstructionsList";
import WeatherImpactCard from "../components/WeatherImpactCard";
import TrafficConditionsCard from "../components/TrafficConditionsCard";
import FuelStationsCard from "../components/FuelStationsCard";
import AvailableTrucksCard from "../components/AvailableTrucksCard";
import RecentDeliveriesCard from "../components/RecentDeliveriesCard";
import DataSourcesCard from "../components/DataSourcesCard";
import AIAnalysisCard from "../components/AIAnalysisCard";
import LoadingSpinner from "../components/LoadingSpinner";
import AIErrorMessage from "../components/AIErrorMessage";
import PageLayout from "../components/PageLayout";
import { useRouteData } from "../hooks/useRouteData";

function RoutePage({ selectedLLM }) {
  const { routeData, calculateRoute, clearRoute, isLoading, error } =
    useRouteData();

  const handleRouteSubmit = async (from, to, timeData = {}) => {
    console.log("Using LLM:", selectedLLM);
    await calculateRoute(from, to, selectedLLM, timeData);
  };

  const handleEditParameters = () => {
    console.log("Edit parameters clicked");
  };

  const handleViewReferences = () => {
    console.log("View references clicked");
  };

  return (
    <PageLayout maxWidth="6xl">
      <div className="space-y-6 sm:space-y-8">
        <RouteForm onSubmit={handleRouteSubmit} isLoading={isLoading} />

        <ActionButtons
          onEditParameters={handleEditParameters}
          onViewReferences={handleViewReferences}
        />

        {error && (
          <AIErrorMessage
            message={error}
            context="route"
            onRetry={() =>
              calculateRoute(routeData.from, routeData.to, selectedLLM)
            }
            onDismiss={clearRoute}
          />
        )}

        {isLoading && <LoadingSpinner />}

        {routeData.eta && !isLoading && (
          <div className="space-y-6 sm:space-y-8">
            {/* Main route information - side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-1">
                <ETADisplay eta={routeData.eta} />
              </div>

              <div className="lg:col-span-2">
                <InstructionsList instructions={routeData.instructions} />
              </div>
            </div>

            {/* Additional route details - 2 column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Weather Impact Card */}
              {routeData.weatherImpact && (
                <WeatherImpactCard weatherImpact={routeData.weatherImpact} />
              )}

              {/* Traffic Conditions Card */}
              {routeData.trafficConditions && (
                <TrafficConditionsCard
                  trafficConditions={routeData.trafficConditions}
                />
              )}
            </div>

            {/* Resource Cards - 2 column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Fuel Stations Card */}
              {routeData.fuelStations && routeData.fuelStations.length > 0 && (
                <FuelStationsCard fuelStations={routeData.fuelStations} />
              )}

              {/* Available Trucks Card */}
              {routeData.availableTrucks &&
                routeData.availableTrucks.length > 0 && (
                  <AvailableTrucksCard trucks={routeData.availableTrucks} />
                )}
            </div>

            {/* Recent Deliveries and Data Sources Cards - 2 column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Recent Deliveries Card */}
              {routeData.recentDeliveries &&
                routeData.recentDeliveries.length > 0 && (
                  <RecentDeliveriesCard
                    deliveries={routeData.recentDeliveries}
                  />
                )}

              {/* Data Sources Card */}
              {routeData.dataSources && (
                <DataSourcesCard dataSources={routeData.dataSources} />
              )}
            </div>

            {/* AI Analysis Card - Full width */}
            {(routeData.aiAnalysis || routeData.routeSummary) && (
              <AIAnalysisCard
                aiAnalysis={routeData.aiAnalysis}
                routeSummary={routeData.routeSummary}
              />
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default RoutePage;
