
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Point } from '@/utils/kmlParser';
import { convertWGS84ToUTM } from '@/utils/coordinateConversions';

type CoordinateFormat = 'utm' | 'latlng';

interface PointInputProps {
  point: Point;
  coordinateFormat: CoordinateFormat;
  canRemove: boolean;
  onUpdate: (id: string, field: 'easting' | 'northing', value: string) => void;
  onRemove: (id: string) => void;
}

const PointInput: React.FC<PointInputProps> = ({
  point,
  coordinateFormat,
  canRemove,
  onUpdate,
  onRemove
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">
          Point {point.label}
        </h3>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(point.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            {coordinateFormat === 'utm' ? 'X (Easting) - meters' : 'Latitude - degrees'}
          </Label>
          <Input
            type="text"
            value={point.easting}
            onChange={(e) => onUpdate(point.id, 'easting', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={coordinateFormat === 'utm' ? '686989.37' : '36.5500000'}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            {coordinateFormat === 'utm' ? 'Y (Northing) - meters' : 'Longitude - degrees'}
          </Label>
          <Input
            type="text"
            value={point.northing}
            onChange={(e) => onUpdate(point.id, 'northing', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={coordinateFormat === 'utm' ? '4046996.29' : '53.0900000'}
          />
        </div>
      </div>

      {/* Conversion display */}
      {point.latitude !== 0 && point.longitude !== 0 && (
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {coordinateFormat === 'utm' ? (
            // Show converted lat/lng for UTM mode
            <>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-green-700 font-medium">Converted Latitude</p>
                <p className="text-green-800 font-mono">{point.latitude.toFixed(8)}°</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-green-700 font-medium">Converted Longitude</p>
                <p className="text-green-800 font-mono">{point.longitude.toFixed(8)}°</p>
              </div>
            </>
          ) : (
            // Show converted UTM for WGS84 mode
            <>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-700 font-medium">UTM X (Easting)</p>
                <p className="text-blue-800 font-mono">
                  {convertWGS84ToUTM(point.latitude, point.longitude).easting.toFixed(2)} m
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-700 font-medium">UTM Y (Northing)</p>
                <p className="text-blue-800 font-mono">
                  {convertWGS84ToUTM(point.latitude, point.longitude).northing.toFixed(2)} m
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PointInput;
