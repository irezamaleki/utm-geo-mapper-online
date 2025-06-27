
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
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center mb-6">
        <MapPin className="h-6 w-6 text-green-600 mr-2" />
        <h2 className="text-2xl font-semibold text-gray-800">Map Visualization</h2>
      </div>

      {validPoints.length >= 2 ? (
        <div className="h-96 rounded-lg overflow-hidden">
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
                  Point {point.label}<br />
                  Lat: {point.latitude.toFixed(6)}°<br />
                  Lng: {point.longitude.toFixed(6)}°
                </Popup>
              </Marker>
            ))}

            {validPoints.length === 3 ? (
              <Polyline positions={polygonCoords} pathOptions={{ color: "red", weight: 3 }} />
            ) : validPoints.length >= 4 ? (
              <Polygon positions={polygonCoords} pathOptions={{ color: "blue", weight: 3, fillOpacity: 0.2 }} />
            ) : null}
          </MapContainer>
        </div>
      ) : (
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Enter at least 2 points to display map</p>
        </div>
      )}
    </div>
  );
};

export default MapVisualization;
