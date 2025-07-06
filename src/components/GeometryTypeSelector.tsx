
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type GeometryType = 'linestring' | 'polygon';

interface GeometryTypeSelectorProps {
  geometryType: GeometryType;
  onGeometryTypeChange: (type: GeometryType) => void;
  validPointsCount: number;
}

const GeometryTypeSelector: React.FC<GeometryTypeSelectorProps> = ({
  geometryType,
  onGeometryTypeChange,
  validPointsCount
}) => {
  const getRequiredPointsMessage = (type: GeometryType) => {
    if (type === 'linestring') {
      return validPointsCount < 2 ? 'A path requires at least 2 points.' : '';
    } else {
      return validPointsCount < 3 ? 'A polygon requires at least 3 points.' : '';
    }
  };

  return (
    <div className="mb-6">
      <Label className="text-sm font-medium text-gray-900 mb-3 block font-inter">
        Export Geometry Type
      </Label>
      <RadioGroup 
        value={geometryType} 
        onValueChange={(value: GeometryType) => onGeometryTypeChange(value)}
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50">
            <RadioGroupItem value="linestring" id="linestring" />
            <Label htmlFor="linestring" className="font-inter text-gray-700 cursor-pointer">
              Path (LineString)
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border border-gray-300 hover:border-gray-400 hover:bg-gray-50">
            <RadioGroupItem value="polygon" id="polygon" />
            <Label htmlFor="polygon" className="font-inter text-gray-700 cursor-pointer">
              Polygon
            </Label>
          </div>
        </div>
      </RadioGroup>
      
      {/* Display validation message */}
      {getRequiredPointsMessage(geometryType) && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-inter">
          {getRequiredPointsMessage(geometryType)}
        </div>
      )}
    </div>
  );
};

export default GeometryTypeSelector;
