import React, { useMemo } from 'react';
import MapComponent from './MapComponent';

// Mock coordinate data - in real implementation, this would come from the backend
const CITY_COORDINATES = {
    'vancouver': [49.2827, -123.1207],
    'calgary': [51.0447, -114.0719],
    'toronto': [43.6532, -79.3832],
    'montreal': [45.5017, -73.5673],
    'winnipeg': [49.8951, -97.1384],
    'edmonton': [53.5461, -113.4938],
    'ottawa': [45.4215, -75.6972],
    'hamilton': [43.2557, -79.8711],
    'london': [42.9849, -81.2453],
    'kitchener': [43.4643, -80.5204],
    'burnaby': [49.2488, -122.9805],
    'richmond': [49.1666, -123.1336],
    'surrey': [49.1913, -122.8490],
    'mississauga': [43.5890, -79.6441],
    'markham': [43.8561, -79.3370],
    'scarborough': [43.7731, -79.2578],
    'north york': [43.7615, -79.4111],
    'etobicoke': [43.6205, -79.5132],
};

// Predefined depot locations for truck positioning fallback
const DEPOT_LOCATIONS = {
    'vancouver': [
        [49.2027, -123.0707], // Richmond depot
        [49.2488, -122.9805], // Burnaby depot  
        [49.1913, -122.8490], // Surrey depot
    ],
    'toronto': [
        [43.5890, -79.6441], // Mississauga depot
        [43.8561, -79.3370], // Markham depot
        [43.6205, -79.5132], // Etobicoke depot
    ],
    'calgary': [
        [51.0247, -114.0519], // SE Calgary depot
        [51.0647, -114.1019], // NW Calgary depot
    ],
    'edmonton': [
        [53.5261, -113.5138], // South Edmonton depot
        [53.5661, -113.4738], // North Edmonton depot
    ]
};

// Helper function to get coordinates for a location
const getCoordinatesForLocation = (location) => {
    if (!location) return null;

    const normalizedLocation = location.toLowerCase().trim();

    // Direct match
    if (CITY_COORDINATES[normalizedLocation]) {
        return CITY_COORDINATES[normalizedLocation];
    }

    // Partial match
    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
        if (normalizedLocation.includes(city) || city.includes(normalizedLocation)) {
            return coords;
        }
    }

    return null;
};

// Helper function to create a mock route path between two points
const createRoutePathBetweenPoints = (start, end) => {
    if (!start || !end) return [];

    // Create a simple curved path between start and end points
    const steps = 5;
    const path = [];

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;

        // Add slight curve for more realistic look
        const curve = Math.sin(t * Math.PI) * 0.01;
        path.push([lat + curve, lng + curve]);
    }

    return path;
};

const RouteMap = ({ routeData, className = '' }) => {
    const mapData = useMemo(() => {
        if (!routeData?.eta) {
            return { markers: [], routePath: [], center: [49.2827, -123.1207] };
        }

        console.log('RouteMap - routeData:', routeData); // Debug log
        console.log('RouteMap - route_geometry:', routeData.route_geometry); // Debug log
        console.log('RouteMap - maneuvers:', routeData.maneuvers); // Debug log

        const markers = [];
        let routePath = [];
        let center = [49.2827, -123.1207]; // Default to Vancouver

        // Use real route geometry if available, otherwise fall back to mock
        if (routeData.route_geometry && routeData.route_geometry.length > 0) {
            console.log('Using real route geometry with', routeData.route_geometry.length, 'points');
            routePath = routeData.route_geometry;
            center = routePath[0] || center; // Start at first coordinate
        } else {
            console.log('Falling back to mock coordinates');
            // Fallback to mock coordinates
            const fromCoords = getCoordinatesForLocation(routeData.eta.from);
            const toCoords = getCoordinatesForLocation(routeData.eta.to);
            console.log('Mock coordinates - from:', fromCoords, 'to:', toCoords);
            if (fromCoords && toCoords) {
                routePath = createRoutePathBetweenPoints(fromCoords, toCoords);
                center = fromCoords;
                console.log('Created mock route path with', routePath.length, 'points');
            }
        }

        // Add start marker - use real coordinates if available
        let startCoords = null;
        if (routeData.route_metadata?.coordinates?.from) {
            startCoords = [
                routeData.route_metadata.coordinates.from.lat,
                routeData.route_metadata.coordinates.from.lon
            ];
        } else {
            startCoords = getCoordinatesForLocation(routeData.eta.from);
        }

        if (startCoords) {
            markers.push({
                id: 'start',
                position: startCoords,
                type: 'start',
                color: '#10B981',
                popup: {
                    title: `Start: ${routeData.eta.from}`,
                    description: 'Route starting point',
                    details: {
                        'Departure': routeData.eta.estimated_departure || 'Now',
                        'Vehicle': routeData.eta.vehicle_type || 'Fuel Truck',
                        'Coordinates': `${startCoords[0].toFixed(4)}, ${startCoords[1].toFixed(4)}`
                    }
                }
            });
        }

        // Add end marker - use real coordinates if available  
        let endCoords = null;
        if (routeData.route_metadata?.coordinates?.to) {
            endCoords = [
                routeData.route_metadata.coordinates.to.lat,
                routeData.route_metadata.coordinates.to.lon
            ];
        } else {
            endCoords = getCoordinatesForLocation(routeData.eta.to);
        }

        if (endCoords) {
            markers.push({
                id: 'end',
                position: endCoords,
                type: 'end',
                color: '#EF4444',
                popup: {
                    title: `Destination: ${routeData.eta.to}`,
                    description: 'Route destination',
                    details: {
                        'ETA': routeData.eta.estimated_arrival || 'Calculating...',
                        'Distance': routeData.eta.total_distance || 'Calculating...',
                        'Coordinates': `${endCoords[0].toFixed(4)}, ${endCoords[1].toFixed(4)}`
                    }
                }
            });
        }

        // Add maneuver markers from real TomTom data if available
        if (routeData.maneuvers && routeData.maneuvers.length > 0) {
            routeData.maneuvers.forEach((maneuver, index) => {
                if (maneuver.coordinates && maneuver.coordinates[0] && maneuver.coordinates[1]) {
                    markers.push({
                        id: `maneuver-${index}`,
                        position: maneuver.coordinates,
                        type: 'marker',
                        color: '#3B82F6',
                        popup: {
                            title: `Step ${maneuver.step_number || index + 1}`,
                            description: maneuver.instruction || 'Continue',
                            details: {
                                'Distance': maneuver.distance_display || 'Unknown',
                                'Time': maneuver.time_display || 'Unknown',
                                'Maneuver': maneuver.maneuver_type || 'continue'
                            }
                        }
                    });
                }
            });
        }

        // Add fuel stations with real coordinates from database
        if (routeData.fuelStations) {
            routeData.fuelStations.forEach((station, index) => {
                // Use real station coordinates if available
                let stationCoords = null;
                if (station.coordinates && station.coordinates.lat && station.coordinates.lon) {
                    stationCoords = [station.coordinates.lat, station.coordinates.lon];
                } else {
                    // Fallback to city lookup
                    stationCoords = getCoordinatesForLocation(station.city);
                }

                if (stationCoords) {
                    markers.push({
                        id: `fuel-${station.station_id || index}`,
                        position: stationCoords,
                        type: 'fuel',
                        color: '#F59E0B',
                        popup: {
                            title: station.name || `Fuel Station ${station.station_id}`,
                            description: `${station.city}, ${station.region}`,
                            details: {
                                'Fuel Type': station.fuel_type || 'Diesel',
                                'Capacity': station.capacity_liters ? `${station.capacity_liters}L` : 'Unknown',
                                'Current Level': station.fuel_level ? `${station.fuel_level}%` : 'Unknown',
                                'Status': station.needs_refuel ? 'Needs Refuel' : 'Available',
                                'Coordinates': `${stationCoords[0].toFixed(4)}, ${stationCoords[1].toFixed(4)}`
                            }
                        }
                    });
                }
            });
        }

        // Add truck locations - use real coordinates if available
        if (routeData.availableTrucks) {
            routeData.availableTrucks.forEach((truck, index) => {
                let truckCoords = null;

                // Try to use truck's actual coordinates if provided
                if (truck.coordinates && truck.coordinates.lat && truck.coordinates.lon) {
                    truckCoords = [truck.coordinates.lat, truck.coordinates.lon];
                } else if (truck.current_location) {
                    // Use truck's current location
                    truckCoords = getCoordinatesForLocation(truck.current_location);
                } else if (startCoords) {
                    // Improved fallback: use predefined depot locations or smart positioning
                    const startCity = routeData.eta.from.toLowerCase();
                    const cityDepots = DEPOT_LOCATIONS[startCity];

                    if (cityDepots && cityDepots.length > 0) {
                        // Use predefined depot locations
                        const depotIndex = index % cityDepots.length;
                        truckCoords = cityDepots[depotIndex];
                    } else {
                        // Fallback to smart positioning around the start city
                        const baseOffset = 0.02; // Larger offset to avoid ocean
                        const angleOffset = (index * 60) * (Math.PI / 180); // Distribute trucks in different directions
                        const latOffset = Math.cos(angleOffset) * baseOffset;
                        const lngOffset = Math.sin(angleOffset) * baseOffset;
                        truckCoords = [
                            startCoords[0] + latOffset,
                            startCoords[1] + lngOffset
                        ];
                    }
                }

                if (truckCoords) {
                    markers.push({
                        id: `truck-${truck.truck_id || index}`,
                        position: truckCoords,
                        type: 'truck',
                        color: '#8B5CF6',
                        popup: {
                            title: `Truck ${truck.truck_id}`,
                            description: truck.driver_name ? `Driver: ${truck.driver_name}` : 'Available',
                            details: {
                                'Status': truck.status || 'Active',
                                'Capacity': truck.capacity_liters ? `${truck.capacity_liters}L` : 'Unknown',
                                'Fuel Type': truck.fuel_type || 'Diesel',
                                'License Plate': truck.license_plate || 'N/A',
                                'Location': truck.current_location || 'Unknown',
                                'Coordinates': `${truckCoords[0].toFixed(4)}, ${truckCoords[1].toFixed(4)}`
                            }
                        }
                    });
                }
            });
        }

        return { markers, routePath, center };
    }, [routeData]);

    // Don't render map if no route data
    if (!routeData?.eta) {
        return (
            <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
                <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                        />
                    </svg>
                    <p className="text-sm">Calculate a route to view the map</p>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Interactive map showing your route from {routeData.eta.from} to {routeData.eta.to}
                    </p>
                </div>

                <MapComponent
                    routePath={mapData.routePath}
                    markers={mapData.markers}
                    center={mapData.center}
                    height="500px"
                    zoom={10}
                />

                {/* Map Legend */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <span>🚀</span>
                            <span className="text-gray-600">Start</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>🏁</span>
                            <span className="text-gray-600">Destination</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>📍</span>
                            <span className="text-gray-600"> Instructions</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>⛽</span>
                            <span className="text-gray-600">Fuel Stations</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>🚛</span>
                            <span className="text-gray-600">Available Trucks</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-blue-500"></span>
                            <span className="text-gray-600">Route Path</span>
                        </div>
                        {routeData.route_metadata?.route_source && (
                            <div className="flex items-center gap-1 ml-auto">
                                <span className="text-xs text-gray-500">
                                    {routeData.route_metadata.route_source}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteMap;