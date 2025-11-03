import { useState } from "react";
import { useOptimizeRoute } from "./useRouteQueries";
import Api from "../services/api";

/**
 * Initial state for route data - DRY principle
 */
const INITIAL_ROUTE_STATE = {
  from: "",
  to: "",
  eta: null,
  instructions: [],
  routeSummary: null,
  weatherImpact: null,
  trafficConditions: null,
  fuelStations: [],
  recentDeliveries: [],
  availableTrucks: [],
  aiAnalysis: "",
  dataSources: null,
};

/**
 * Custom hook for managing route calculation state using React Query
 */
export function useRouteData() {
  const [routeData, setRouteData] = useState(INITIAL_ROUTE_STATE);

  const optimizeRouteMutation = useOptimizeRoute();

  const calculateRoute = async (from, to, llmModel, timeData = {}) => {
    optimizeRouteMutation.mutate(
      { from, to, llmModel, timeData },
      {
        onSuccess: (result) => {
          const transformedData = Api.transformRouteResponse(result);
          setRouteData({
            from,
            to,
            ...transformedData,
          });
        },
      }
    );
  };

  const clearRoute = () => {
    setRouteData(INITIAL_ROUTE_STATE);
    optimizeRouteMutation.reset();
  };

  return {
    routeData,
    calculateRoute,
    clearRoute,
    isLoading: optimizeRouteMutation.isPending,
    error: optimizeRouteMutation.error?.message,
  };
}
