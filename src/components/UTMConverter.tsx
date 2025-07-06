import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import JSZip from 'jszip';
import L from 'leaflet';

import { convertUTMToWGS84, convertWGS84ToUTM } from '@/utils/coordinateConversions';
import { calculatePolygonArea } from '@/utils/geometryCalculations';
import { Point, generateLabel } from '@/utils/kmlParser';
import Header from './Header';
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
        const lat = parseFloat(point.easting);
        const lng = parseFloat(point.northing);
        
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
    if (points.length < 10) {
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
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white border border-gray-200 p-8">
            {/* Coordinate Format Selection with Upload Icon */}
            <div className="mb-8 relative">
              <FileUploadSection onPointsLoaded={setPoints} />
              <Label className="text-lg font-semibold text-gray-900 mb-6 block font-cal-sans">
                Coordinate Format
              </Label>
              <RadioGroup value={coordinateFormat} onValueChange={(value: CoordinateFormat) => setCoordinateFormat(value)}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                    <RadioGroupItem value="utm" id="utm" />
                    <Label htmlFor="utm" className="font-inter font-medium text-gray-700 cursor-pointer">UTM Zone 39N (X/Y meters)</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                    <RadioGroupItem value="latlng" id="latlng" />
                    <Label htmlFor="latlng" className="font-inter font-medium text-gray-700 cursor-pointer">WGS84 (Latitude/Longitude degrees)</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Calculator className="h-6 w-6 text-gray-900 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 font-cal-sans">
                  {coordinateFormat === 'utm' ? 'UTM Coordinates' : 'WGS84 Coordinates'}
                </h2>
              </div>
            </div>
            
            <div className="bg-blue-50 px-2 py-1 mb-8 border border-blue-200 inline-block">
              <p className="text-xs text-blue-700 font-inter font-light">
                {coordinateFormat === 'utm' ? 'Zone: 39N | Datum: WGS 84' : 'Datum: WGS 84'}
              </p>
              {validPoints.length === 3 && (
                <p className="text-xs text-blue-600 font-inter font-light mt-1">3 points = Path (Polyline)</p>
              )}
              {validPoints.length >= 4 && (
                <p className="text-xs text-blue-600 font-inter font-light mt-1">4+ points = Polygon</p>
              )}
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

              {points.length < 10 && (
                <Button
                  onClick={addPoint}
                  className="w-full font-inter font-medium bg-gray-900 hover:bg-gray-800 text-white"
                  variant="default"
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
                className="mt-8 w-full font-inter font-medium bg-orange-500 hover:bg-orange-600 text-white"
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
