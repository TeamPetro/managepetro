import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different types of markers
const createCustomIcon = (color = 'blue', iconType = 'marker') => {
  const iconMapping = {
    start: '🚀',
    end: '🏁', 
    fuel: '⛽',
    truck: '🚛',
    marker: '📍'
  };

  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      font-size: 16px;
    ">${iconMapping[iconType] || iconMapping.marker}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Component to fit map bounds to route
function MapBounds({ routePath, markers }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const allPoints = [];
    
    // Add route path points
    if (routePath && routePath.length > 0) {
      allPoints.push(...routePath);
    }
    
    // Add marker points
    if (markers && markers.length > 0) {
      markers.forEach(marker => {
        if (marker.position) {
          allPoints.push(marker.position);
        }
      });
    }
    
    if (allPoints.length > 0) {
      const group = L.featureGroup(allPoints.map(point => L.marker(point)));
      map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  }, [map, routePath, markers]);
  
  return null;
}

const MapComponent = ({ 
  routePath = [], 
  markers = [], 
  center = [49.2827, -123.1207], // Default to Vancouver
  zoom = 10,
  height = '400px',
  className = ''
}) => {
  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route polyline */}
        {routePath && routePath.length > 1 && (
          <Polyline
            positions={routePath}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
          />
        )}
        
        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={marker.position}
            icon={createCustomIcon(marker.color, marker.type)}
          >
            {marker.popup && (
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{marker.popup.title}</div>
                  {marker.popup.description && (
                    <div className="text-gray-600 mt-1">{marker.popup.description}</div>
                  )}
                  {marker.popup.details && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(marker.popup.details).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
        
        {/* Auto-fit map bounds */}
        <MapBounds routePath={routePath} markers={markers} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;