/**
 * Main API hooks facade
 * Re-exports all React Query hooks for convenience
 * @module hooks/useApiQueries
 */

// Re-export domain-specific hooks
export * from "./useTruckQueries";
export * from "./useStationQueries";
export * from "./useTripQueries";
export * from "./useRouteQueries";
export * from "./useDispatchQueries";
