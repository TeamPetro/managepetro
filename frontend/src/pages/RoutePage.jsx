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
import CollapsibleSection from "../components/CollapsibleSection";
import RouteLoadingBar from "../components/RouteLoadingBar";
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

  // Safely check if we have results
  const hasResults = !!routeData?.eta && !isLoading;

  return (
    <PageLayout maxWidth="6xl">
      {/* Global loading bar while the route is being calculated */}
      <RouteLoadingBar isLoading={isLoading} />

      {/* Whole page: main column + skinny sidebar on large screens */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1fr)] items-start">
        {/* ================= MAIN COLUMN ================= */}
        <div className="space-y-8">
          {/* 1. Plan route – full size before results, collapsible after */}
          {!hasResults ? (
            // FULL SIZE FORM when no results yet
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Plan Delivery Route
              </h2>

              <div className="space-y-6">
                <RouteForm onSubmit={handleRouteSubmit} isLoading={isLoading} />

                {error && (
                  <AIErrorMessage
                    message={error}
                    context="route"
                    onRetry={() =>
                      calculateRoute(
                        routeData?.from,
                        routeData?.to,
                        selectedLLM
                      )
                    }
                    onDismiss={clearRoute}
                  />
                )}

                {/* Optional: keep spinner OR remove this line if you want only the bar */}
                {isLoading && <LoadingSpinner />}
              </div>
            </section>
          ) : (
            // SMALLER COLLAPSIBLE FORM when results exist
            <CollapsibleSection
              title="Edit Delivery Route"
              description="Update origin, destination, or scheduling parameters and recalculate."
              defaultOpen={false}
            >
              <div className="space-y-4">
                <RouteForm
                  onSubmit={handleRouteSubmit}
                  isLoading={isLoading}
                />

                {error && (
                  <AIErrorMessage
                    message={error}
                    context="route"
                    onRetry={() =>
                      calculateRoute(
                        routeData?.from,
                        routeData?.to,
                        selectedLLM
                      )
                    }
                    onDismiss={clearRoute}
                  />
                )}

                {isLoading && <LoadingSpinner />}
              </div>
            </CollapsibleSection>
          )}

          {/* 2. Trip overview + directions (collapsible, only when we have data) */}
          {hasResults && (
            <CollapsibleSection
              title="Trip Overview"
              description="High-level summary, ETA, and detailed turn-by-turn instructions."
              defaultOpen={true}
            >
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)] items-start">
                  {/* Left: summary cards */}
                  <div className="space-y-6">
                    <ETADisplay eta={routeData.eta} />

                    {(routeData.aiAnalysis || routeData.routeSummary) && (
                      <AIAnalysisCard
                        aiAnalysis={routeData.aiAnalysis}
                        routeSummary={routeData.routeSummary}
                      />
                    )}
                  </div>

                  {/* Right: detailed directions */}
                  <div>
                    <InstructionsList instructions={routeData.instructions} />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* ================= SIDEBAR COLUMN ================= */}
        <aside className="space-y-5 lg:border-l lg:border-slate-800 lg:pl-6 text-sm">
          {/* Controls */}
          <section className="space-y-3">
            <p className="text-sm font-medium text-slate-300 tracking-wide uppercase">
              Controls
            </p>
            <ActionButtons
              onEditParameters={handleEditParameters}
              onViewReferences={handleViewReferences}
            />
          </section>

          {/* Current conditions – collapsible */}
          <CollapsibleSection
            title="Current Conditions"
            description="Weather and traffic factors that may impact this route."
            defaultOpen={true}
          >
            <div className="space-y-4">
              {routeData?.weatherImpact && (
                <WeatherImpactCard weatherImpact={routeData.weatherImpact} />
              )}

              {routeData?.trafficConditions && (
                <TrafficConditionsCard
                  trafficConditions={routeData.trafficConditions}
                />
              )}
            </div>
          </CollapsibleSection>

          {/* Fleet & data snapshot – collapsible, only with results */}
          {hasResults && (
            <CollapsibleSection
              title="Fleet & Data Snapshot"
              description="Supporting operational context for this delivery."
              defaultOpen={false} // starts closed so sidebar feels lighter
            >
              <div className="space-y-4">
                {routeData?.availableTrucks &&
                  routeData.availableTrucks.length > 0 && (
                    <AvailableTrucksCard trucks={routeData.availableTrucks} />
                  )}

                {routeData?.fuelStations &&
                  routeData.fuelStations.length > 0 && (
                    <FuelStationsCard fuelStations={routeData.fuelStations} />
                  )}

                {routeData?.recentDeliveries &&
                  routeData.recentDeliveries.length > 0 && (
                    <RecentDeliveriesCard
                      deliveries={routeData.recentDeliveries}
                    />
                  )}

                {routeData?.dataSources && (
                  <DataSourcesCard dataSources={routeData.dataSources} />
                )}
              </div>
            </CollapsibleSection>
          )}
        </aside>
      </div>
    </PageLayout>
  );
}

export default RoutePage;
