import RouteForm from "../components/RouteForm";
import ActionButtons from "../components/ActionButtons";
import ETADisplay from "../components/ETADisplay";
import InstructionsList from "../components/InstructionsList";
import RouteMap from "../components/RouteMap";
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
    await calculateRoute(from, to, selectedLLM, timeData);
  };

  const handleEditParameters = () => {};
  const handleViewReferences = () => {};

  const hasResults = !!routeData?.eta && !isLoading;

  return (
    <PageLayout maxWidth="6xl">
      <RouteLoadingBar isLoading={isLoading} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1fr)] items-start">
        {/* ================= FULL-WIDTH PLANNER ================= */}
        {!hasResults && (
          <section className="space-y-4 lg:col-span-2">
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
                    calculateRoute(routeData?.from, routeData?.to, selectedLLM)
                  }
                  onDismiss={clearRoute}
                />
              )}

              {isLoading && <LoadingSpinner />}
            </div>

            {/* Small tucked-away controls */}
            <div className="flex justify-end">
              <div className="text-xs text-slate-400">
                <ActionButtons
                  onEditParameters={handleEditParameters}
                  onViewReferences={handleViewReferences}
                />
              </div>
            </div>
          </section>
        )}

        {/* ================= MAIN COLUMN ================= */}
        {hasResults && (
          <div className="space-y-10">
            {/* --- Collapsible mini planner --- */}
            <CollapsibleSection
              title="Edit Delivery Route"
              description="Update origin, destination, or scheduling parameters and recalculate."
              defaultOpen={false}
            >
              <div className="space-y-4">
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

                {isLoading && <LoadingSpinner />}
              </div>
            </CollapsibleSection>

            {/* Small, subtle buttons under the mini planner */}
            <div className="flex justify-end">
              <div className="text-xs text-slate-400">
                <ActionButtons
                  onEditParameters={handleEditParameters}
                  onViewReferences={handleViewReferences}
                />
              </div>
            </div>

            {/* --- Balanced, aesthetic grid layout --- */}
            <div className="space-y-10">
              {/* 2-column grid with matching panel styles */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* LEFT PANEL */}
                <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 h-full">
                  <ETADisplay eta={routeData.eta} />

                  {(routeData.aiAnalysis || routeData.routeSummary) && (
                    <AIAnalysisCard
                      aiAnalysis={routeData.aiAnalysis}
                      routeSummary={routeData.routeSummary}
                    />
                  )}
                </div>

                {/* RIGHT PANEL */}
                <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 h-full">
                  <InstructionsList
                    instructions={routeData.instructions}
                    maneuvers={routeData.maneuvers}
                  />
                </div>
              </div>

              {/* MAP tucked below in a clean card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <RouteMap routeData={routeData} />
              </div>
            </div>
          </div>
        )}

        {/* ================= SIDEBAR ================= */}
        <aside className="space-y-5 lg:border-l lg:border-slate-800 lg:pl-6 text-sm">
          {hasResults && (
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
          )}

          {hasResults && (
            <CollapsibleSection
              title="Fleet & Data Snapshot"
              description="Supporting operational context for this delivery."
              defaultOpen={false}
            >
              <div className="space-y-4">
                {routeData?.availableTrucks?.length > 0 && (
                  <AvailableTrucksCard trucks={routeData.availableTrucks} />
                )}

                {routeData?.fuelStations?.length > 0 && (
                  <FuelStationsCard fuelStations={routeData.fuelStations} />
                )}

                {routeData?.recentDeliveries?.length > 0 && (
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
