
import React from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup } from 'react-leaflet';
import { Point } from '@/utils/kmlParser';
import 'leaflet/dist/leaflet.css';

interface MapVisualizationProps {
  validPoints: Point[];
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ validPoints }) => {
  const mapCenter: [number, number] = validPoints.length > 0 
    ? [validPoints[0].latitude, validPoints[0].longitude]
    : [36.55, 53.09];

  const polygonCoords: [number, number][] = validPoints.map(p => [p.latitude, p.longitude]);

  return (
    <div className="sticky top-0 h-screen bg-white border-l border-gray-300">
      <div className="flex items-center px-6 py-4 border-b border-gray-300">
        <MapPin className="h-5 w-5 text-gray-900 mr-3" />
        <h2 className="text-lg font-semibold text-gray-900 font-cal-sans">Map Visualization</h2>
      </div>

      {validPoints.length >= 2 ? (
        <div className="h-[calc(100vh-80px)]">
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {validPoints.map((point) => (
              <Marker key={point.id} position={[point.latitude, point.longitude]}>
                <Popup>
                  <div className="font-inter">
                    Point {point.label}<br />
                    Lat: {point.latitude.toFixed(6)}°<br />
                    Lng: {point.longitude.toFixed(6)}°
                  </div>
                </Popup>
              </Marker>
            ))}

            {validPoints.length === 3 ? (
              <Polyline positions={polygonCoords} pathOptions={{ color: "#374151", weight: 3 }} />
            ) : validPoints.length >= 4 ? (
              <Polygon positions={polygonCoords} pathOptions={{ color: "#374151", weight: 3, fillOpacity: 0.1 }} />
            ) : null}
          </MapContainer>
        </div>
      ) : (
        <div className="h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-inter">Enter at least 2 points to display map</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
