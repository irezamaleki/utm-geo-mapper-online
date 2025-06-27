
import React, { useState, useEffect } from 'react';
import { Calculator, Globe, Plus, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import JSZip from 'jszip';
import L from 'leaflet';

import { convertUTMToWGS84 } from '@/utils/coordinateConversions';
import { calculatePolygonArea } from '@/utils/geometryCalculations';
import { Point, generateLabel } from '@/utils/kmlParser';
import FileUploadSection from './FileUploadSection';
import PointInput from './PointInput';
import StatisticsDisplay from './StatisticsDisplay';
import MapVisualization from './MapVisualization';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type CoordinateFormat = 'utm' | 'latlng';

const UTMConverter = () => {
  const [points, setPoints] = useState<Point[]>([
    { id: '1', easting: '', northing: '', latitude: 0, longitude: 0, label: 'A' }
  ]);
  const [coordinateFormat, setCoordinateFormat] = useState<CoordinateFormat>('utm');

  const generateKMZ = async () => {
    if (validPoints.length < 2) return;

    const coordinates = validPoints.map(p => `${p.longitude},${p.latitude},0`).join(' ');
    
    let geometryType: string;
    let coords: string;
    
    if (validPoints.length === 3) {
      geometryType = 'LineString';
      coords = coordinates;
    } else if (validPoints.length >= 4) {
      geometryType = 'Polygon';
      coords = `${coordinates} ${validPoints[0].longitude},${validPoints[0].latitude},0`;
    } else {
      return;
    }

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>UTM Converted ${geometryType}</name>
    <Placemark>
      <name>${geometryType === 'Polygon' ? 'Polygon' : 'Path'}</name>
      ${geometryType === 'Polygon' ? `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>` : `
      <LineString>
        <coordinates>${coords}</coordinates>
      </LineString>`}
    </Placemark>
  </Document>
</kml>`;

    const zip = new JSZip();
    zip.file('doc.kml', kml);
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utm_converted_${geometryType.toLowerCase()}.kmz`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const updatedPoints = points.map((point, index) => {
      const label = generateLabel(index);
      
      if (coordinateFormat === 'utm') {
        // UTM mode: easting = X, northing = Y
        const eastingNum = parseFloat(point.easting);
        const northingNum = parseFloat(point.northing);
        
        if (!isNaN(eastingNum) && !isNaN(northingNum) && point.easting.trim() !== '' && point.northing.trim() !== '') {
          try {
            const result = convertUTMToWGS84(eastingNum, northingNum);
            return { 
              ...point, 
              latitude: result.latitude, 
              longitude: result.longitude,
              label
            };
          } catch (error) {
            console.error('UTM conversion error:', error);
            return { ...point, latitude: 0, longitude: 0, label };
          }
        }
      } else {
        // WGS84 mode: easting field = latitude, northing field = longitude
        const lat = parseFloat(point.easting);  // Latitude is in the "easting" field in WGS84 mode
        const lng = parseFloat(point.northing); // Longitude is in the "northing" field in WGS84 mode
        
        if (!isNaN(lat) && !isNaN(lng) && point.easting.trim() !== '' && point.northing.trim() !== '' && 
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return {
            ...point,
            latitude: lat,
            longitude: lng,
            label
          };
        }
      }
      return { ...point, latitude: 0, longitude: 0, label };
    });
    
    if (JSON.stringify(updatedPoints) !== JSON.stringify(points)) {
      setPoints(updatedPoints);
    }
  }, [coordinateFormat, points.map(p => `${p.easting}-${p.northing}`).join(',')]);

  const addPoint = () => {
    if (points.length < 10) { // Allow up to 10 points (A-J)
      const newIndex = points.length;
      setPoints([...points, { 
        id: Date.now().toString(), 
        easting: '', 
        northing: '', 
        latitude: 0, 
        longitude: 0,
        label: generateLabel(newIndex)
      }]);
    }
  };

  const removePoint = (id: string) => {
    if (points.length > 1) {
      const filteredPoints = points.filter(p => p.id !== id);
      // Relabel remaining points
      const relabeledPoints = filteredPoints.map((point, index) => ({
        ...point,
        label: generateLabel(index)
      }));
      setPoints(relabeledPoints);
    }
  };

  const updatePoint = (id: string, field: 'easting' | 'northing', value: string) => {
    setPoints(points.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const validPoints = points.filter(p => 
    !isNaN(parseFloat(p.easting)) && !isNaN(parseFloat(p.northing)) && 
    p.easting.trim() !== '' && p.northing.trim() !== '' &&
    p.latitude !== 0 && p.longitude !== 0
  );

  const polygonCoords: [number, number][] = validPoints.map(p => [p.latitude, p.longitude]);
  const isPolygon = validPoints.length >= 4;
  const area = isPolygon ? calculatePolygonArea(polygonCoords) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Globe className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">UTM to WGS84 Converter</h1>
          </div>
          <p className="text-gray-600 text-lg">Convert coordinates and visualize on map</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Coordinate Format Selection */}
            <div className="mb-6">
              <Label className="text-lg font-semibold text-gray-800 mb-4 block">
                Coordinate Format
              </Label>
              <RadioGroup value={coordinateFormat} onValueChange={(value: CoordinateFormat) => setCoordinateFormat(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="utm" id="utm" />
                  <Label htmlFor="utm">UTM Zone 39N (X/Y meters)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="latlng" id="latlng" />
                  <Label htmlFor="latlng">WGS84 (Latitude/Longitude degrees)</Label>
                </div>
              </RadioGroup>
            </div>

            <FileUploadSection onPointsLoaded={setPoints} />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Calculator className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  {coordinateFormat === 'utm' ? 'UTM Coordinates' : 'WGS84 Coordinates'}
                </h2>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-700 font-medium">
                {coordinateFormat === 'utm' ? 'Zone: 39N | Datum: WGS 84' : 'Datum: WGS 84'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {validPoints.length === 3 && "3 points = Path (Polyline)"}
                {validPoints.length >= 4 && "4+ points = Polygon"}
              </p>
            </div>

            <div className="space-y-6">
              {points.map((point, index) => (
                <PointInput
                  key={point.id}
                  point={point}
                  coordinateFormat={coordinateFormat}
                  canRemove={points.length > 1}
                  onUpdate={updatePoint}
                  onRemove={removePoint}
                />
              ))}

              {/* Add Point button */}
              {points.length < 10 && (
                <Button
                  onClick={addPoint}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Point
                </Button>
              )}
            </div>

            <StatisticsDisplay validPoints={validPoints} area={area} />

            {validPoints.length >= 2 && (
              <Button
                onClick={generateKMZ}
                className="mt-6 w-full"
                variant="default"
              >
                <Download className="h-5 w-5 mr-2" />
                Download KMZ File ({validPoints.length === 3 ? 'Path' : 'Polygon'})
              </Button>
            )}
          </div>

          {/* Map Section */}
          <MapVisualization validPoints={validPoints} />
        </div>
      </div>
    </div>
  );
};

export default UTMConverter;
