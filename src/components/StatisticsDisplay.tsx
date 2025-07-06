
import React from 'react';
import { calculateDistance } from '@/utils/geometryCalculations';
import { Point } from '@/utils/kmlParser';
import { BarChart3, Square } from 'lucide-react';

interface StatisticsDisplayProps {
  validPoints: Point[];
  area?: number;
}

const StatisticsDisplay: React.FC<StatisticsDisplayProps> = ({ validPoints, area }) => {
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
      {edgeLengths.length > 0 && (
        <div className="mt-8 bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 p-6 rounded-xl hover:shadow-md transition-all duration-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-purple-900 font-cal-sans">Edge Lengths</p>
          </div>
          <div className="space-y-3">
            {edgeLengths.map((edge, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white/60 rounded-lg border border-purple-100">
                <span className="text-purple-800 font-medium font-inter">{edge.label}</span>
                <span className="text-purple-900 font-mono font-bold">{edge.length.toFixed(2)} m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPolygon && area !== undefined && (
        <div className="mt-6 bg-teal-50/80 backdrop-blur-sm border border-teal-200/50 p-6 rounded-xl hover:shadow-md transition-all duration-200">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-teal-100 rounded-lg mr-3">
              <Square className="h-5 w-5 text-teal-600" />
            </div>
            <p className="text-lg font-bold text-teal-900 font-cal-sans">Polygon Area</p>
          </div>
          <p className="text-3xl font-mono font-bold text-teal-900">{area.toFixed(2)} m²</p>
        </div>
      )}
    </>
  );
};

export default StatisticsDisplay;
