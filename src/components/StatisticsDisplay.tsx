
import React from 'react';
import { calculateDistance } from '@/utils/geometryCalculations';
import { Point } from '@/utils/kmlParser';

interface StatisticsDisplayProps {
  validPoints: Point[];
  area?: number;
}

const StatisticsDisplay: React.FC<StatisticsDisplayProps> = ({ validPoints, area }) => {
  // Calculate edge lengths
  const calculateEdgeLengths = (): { label: string; length: number }[] => {
    if (validPoints.length < 2) return [];
    
    const edges: { label: string; length: number }[] = [];
    
    for (let i = 0; i < validPoints.length - 1; i++) {
      const p1 = validPoints[i];
      const p2 = validPoints[i + 1];
      const distance = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      edges.push({
        label: `${p1.label} → ${p2.label}`,
        length: distance
      });
    }
    
    // If it's a polygon (4+ points), add the closing edge
    if (validPoints.length >= 4) {
      const lastPoint = validPoints[validPoints.length - 1];
      const firstPoint = validPoints[0];
      const distance = calculateDistance(lastPoint.latitude, lastPoint.longitude, firstPoint.latitude, firstPoint.longitude);
      edges.push({
        label: `${lastPoint.label} → ${firstPoint.label}`,
        length: distance
      });
    }
    
    return edges;
  };

  const edgeLengths = calculateEdgeLengths();
  const isPolygon = validPoints.length >= 4;

  return (
    <>
      {/* Edge Lengths */}
      {edgeLengths.length > 0 && (
        <div className="mt-6 bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-800 mb-3">Edge Lengths</p>
          <div className="space-y-2">
            {edgeLengths.map((edge, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-purple-700 font-medium">{edge.label}</span>
                <span className="text-purple-900 font-mono">{edge.length.toFixed(2)} m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Polygon Area */}
      {isPolygon && area !== undefined && (
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-2">Polygon Area</p>
          <p className="text-xl font-mono text-yellow-900">{area.toFixed(2)} m²</p>
        </div>
      )}
    </>
  );
};

export default StatisticsDisplay;
