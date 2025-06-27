import React, { useState, useEffect } from 'react';
import { Calculator, MapPin, Globe, Plus, Trash2, Download, Upload } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup } from 'react-leaflet';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import JSZip from 'jszip';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Point {
  id: string;
  easting: string;
  northing: string;
  latitude: number;
  longitude: number;
  label: string;
}

type CoordinateFormat = 'utm' | 'latlng';

const UTMConverter = () => {
  const [points, setPoints] = useState<Point[]>([
    { id: '1', easting: '', northing: '', latitude: 0, longitude: 0, label: 'A' }
  ]);
  const [coordinateFormat, setCoordinateFormat] = useState<CoordinateFormat>('utm');

  // Function to calculate distance between two lat/lng points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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

  // Improved UTM to WGS84 conversion function for Zone 39N
  const convertUTMToWGS84 = (easting: number, northing: number) => {
    // WGS84 ellipsoid parameters
    const a = 6378137.0; // Semi-major axis in meters
    const f = 1 / 298.257223563; // Flattening
    const e2 = 2 * f - f * f; // First eccentricity squared
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const k0 = 0.9996; // UTM scale factor
    
    // Zone 39N parameters
    const zone = 39;
    const centralMeridian = (zone - 1) * 6 - 180 + 3; // -57 degrees for zone 39
    
    // Remove false easting
    const x = easting - 500000;
    const y = northing;
    
    // Calculate meridional arc
    const M = y / k0;
    
    // Calculate footprint latitude
    const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
    
    // Calculate phi1 (footprint latitude)
    const J1 = 3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32;
    const J2 = 21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32;
    const J3 = 151 * Math.pow(e1, 3) / 96;
    const J4 = 1097 * Math.pow(e1, 4) / 512;
    
    const phi1 = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);
    
    // Calculate parameters for latitude and longitude
    const sinPhi1 = Math.sin(phi1);
    const cosPhi1 = Math.cos(phi1);
    const tanPhi1 = Math.tan(phi1);
    
    const e1sq = e2 / (1 - e2);
    const C1 = e1sq * cosPhi1 * cosPhi1;
    const T1 = tanPhi1 * tanPhi1;
    const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1);
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5);
    const D = x / (N1 * k0);
    
    // Calculate latitude
    const Q1 = N1 * tanPhi1 / R1;
    const Q2 = D * D / 2;
    const Q3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * Math.pow(D, 4) / 24;
    const Q4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 1.6 * e1sq - 37 * e1sq * C1) * Math.pow(D, 6) / 720;
    
    const lat = phi1 - Q1 * (Q2 - Q3 + Q4);
    
    // Calculate longitude
    const Q5 = D;
    const Q6 = (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6;
    const Q7 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) * Math.pow(D, 5) / 120;
    
    const lon = centralMeridian * Math.PI / 180 + (Q5 - Q6 + Q7) / cosPhi1;
    
    // Convert to degrees
    const latDeg = lat * 180 / Math.PI;
    const lonDeg = lon * 180 / Math.PI;
    
    console.log('UTM to WGS84 conversion:', {
      input: { easting, northing },
      output: { latDeg, lonDeg }
    });
    
    return { latitude: latDeg, longitude: lonDeg };
  };

  // WGS84 to UTM conversion (Zone 39N)
  const convertWGS84ToUTM = (lat: number, lng: number) => {
    const zone = 39;
    const centralMeridian = (zone - 1) * 6 - 180 + 3; // 51 degrees for zone 39
    const a = 6378137.0;
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const e2 = 2 * f - f * f;

    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    const centralMeridianRad = centralMeridian * Math.PI / 180;

    const deltaLng = lngRad - centralMeridianRad;
    
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const tanLat = Math.tan(latRad);
    
    const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
    const T = tanLat * tanLat;
    const C = (e2 / (1 - e2)) * cosLat * cosLat;
    const A = cosLat * deltaLng;
    
    const M = a * ((1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * latRad
                - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * Math.sin(2 * latRad)
                + (15*e2*e2/256 + 45*e2*e2*e2/1024) * Math.sin(4 * latRad)
                - (35*e2*e2*e2/3072) * Math.sin(6 * latRad));
    
    const easting = 500000 + k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6
                    + (5 - 18*T + T*T + 72*C - 58*(e2/(1-e2))) * Math.pow(A, 5) / 120);
    
    const northing = k0 * (M + N * tanLat * (A*A/2 + (5 - T + 9*C + 4*C*C) * Math.pow(A, 4) / 24
                     + (61 - 58*T + T*T + 600*C - 330*(e2/(1-e2))) * Math.pow(A, 6) / 720));

    console.log('WGS84 to UTM conversion:', {
      input: { lat, lng },
      output: { easting, northing }
    });

    return { easting, northing: northing < 0 ? northing + 10000000 : northing };
  };

  // Proper geographic area calculation using the shoelace formula with spherical coordinates
  const calculatePolygonArea = (coords: [number, number][]): number => {
    if (coords.length < 4) return 0; // Need at least 4 points for a polygon
    
    // Convert to radians
    const coordsRad = coords.map(([lat, lon]) => [lat * Math.PI / 180, lon * Math.PI / 180]);
    
    let area = 0;
    const R = 6371000; // Earth's radius in meters
    
    // Use spherical excess formula for more accurate area calculation
    for (let i = 0; i < coordsRad.length; i++) {
      const j = (i + 1) % coordsRad.length;
      const [lat1, lon1] = coordsRad[i];
      const [lat2, lon2] = coordsRad[j];
      
      area += (lon2 - lon1) * Math.sin((lat1 + lat2) / 2);
    }
    
    area = Math.abs(area) * R * R / 2;
    
    console.log('Area calculation:', {
      coords: coords,
      coordsRad: coordsRad,
      calculatedArea: area
    });
    
    return area;
  };

  // Improved KML parsing function
  const parseKMLContent = (kmlContent: string): Point[] => {
    console.log('Parsing KML content:', kmlContent.substring(0, 500));
    
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
    const parsedPoints: Point[] = [];

    // Check for XML parsing errors
    const parserError = kmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }

    // Try multiple ways to find coordinates
    const coordinatesElements = kmlDoc.getElementsByTagName('coordinates');
    console.log('Found coordinates elements:', coordinatesElements.length);

    for (let i = 0; i < coordinatesElements.length; i++) {
      const coordElement = coordinatesElements[i];
      const coordText = coordElement.textContent?.trim();
      console.log('Coordinate text:', coordText);
      
      if (coordText) {
        // Split by whitespace, newlines, or commas outside of coordinate pairs
        const coordPairs = coordText.split(/\s+/).filter(pair => pair.trim() !== '');
        console.log('Coordinate pairs:', coordPairs);
        
        coordPairs.forEach((pair, index) => {
          const coords = pair.split(',');
          if (coords.length >= 2) {
            const lng = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              console.log('Adding point:', { lat, lng });
              
              // Convert to UTM for storage consistency
              const utmCoords = convertWGS84ToUTM(lat, lng);
              parsedPoints.push({
                id: `kml_${Date.now()}_${index}`,
                easting: utmCoords.easting.toFixed(2),
                northing: utmCoords.northing.toFixed(2),
                latitude: lat,
                longitude: lng,
                label: generateLabel(index)
              });
            }
          }
        });
      }
    }

    console.log('Parsed points:', parsedPoints);
    return parsedPoints;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Uploading file:', file.name, file.type);

    try {
      let kmlContent = '';
      
      if (file.name.toLowerCase().endsWith('.kmz')) {
        console.log('Processing KMZ file');
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        // Look for KML files in the zip
        const kmlFiles = Object.keys(zipContent.files).filter(name => 
          name.toLowerCase().endsWith('.kml')
        );
        
        console.log('Found KML files in KMZ:', kmlFiles);
        
        if (kmlFiles.length > 0) {
          const kmlFile = zipContent.files[kmlFiles[0]];
          kmlContent = await kmlFile.async('text');
        }
      } else if (file.name.toLowerCase().endsWith('.kml')) {
        console.log('Processing KML file');
        kmlContent = await file.text();
      }

      if (kmlContent) {
        console.log('KML content length:', kmlContent.length);
        const parsedPoints = parseKMLContent(kmlContent);
        if (parsedPoints.length > 0) {
          setPoints(parsedPoints);
          console.log('Successfully loaded', parsedPoints.length, 'points from file');
        } else {
          console.error('No valid points found in the file');
        }
      } else {
        console.error('No KML content found in the file');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    }

    // Reset file input
    event.target.value = '';
  };

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

  // Generate alphabetical labels
  const generateLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D, ...
  };

  useEffect(() => {
    const updatedPoints = points.map((point, index) => {
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
              label: generateLabel(index)
            };
          } catch (error) {
            console.error('UTM conversion error:', error);
            return { ...point, latitude: 0, longitude: 0, label: generateLabel(index) };
          }
        }
      } else {
        // WGS84 mode: easting = latitude, northing = longitude
        const lat = parseFloat(point.easting);
        const lng = parseFloat(point.northing);
        
        if (!isNaN(lat) && !isNaN(lng) && point.easting.trim() !== '' && point.northing.trim() !== '') {
          return {
            ...point,
            latitude: lat,
            longitude: lng,
            label: generateLabel(index)
          };
        }
      }
      return { ...point, latitude: 0, longitude: 0, label: generateLabel(index) };
    });
    
    setPoints(updatedPoints);
  }, [points.map(p => `${p.easting}-${p.northing}`).join(','), coordinateFormat]);

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

  const mapCenter: [number, number] = validPoints.length > 0 
    ? [validPoints[0].latitude, validPoints[0].longitude]
    : [36.55, 53.09];

  const polygonCoords: [number, number][] = validPoints.map(p => [p.latitude, p.longitude]);
  const isPolygon = validPoints.length >= 4;
  const area = isPolygon ? calculatePolygonArea(polygonCoords) : 0;
  const edgeLengths = calculateEdgeLengths();

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

            {/* File Upload */}
            <div className="mb-6">
              <Label className="text-lg font-semibold text-gray-800 mb-4 block">
                Import KML/KMZ File
              </Label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".kml,.kmz"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50"
                >
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-gray-600">Upload KML/KMZ file</span>
                </Label>
              </div>
            </div>

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
                <div key={point.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-700">
                      Point {point.label}
                    </h3>
                    {points.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePoint(point.id)}
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
                        onChange={(e) => updatePoint(point.id, 'easting', e.target.value)}
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
                        onChange={(e) => updatePoint(point.id, 'northing', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={coordinateFormat === 'utm' ? '4046996.29' : '53.0900000'}
                      />
                    </div>
                  </div>

                  {/* Conversion display - only show for UTM mode */}
                  {coordinateFormat === 'utm' && point.latitude !== 0 && point.longitude !== 0 && (
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-sm text-green-700 font-medium">Converted Latitude</p>
                        <p className="text-green-800 font-mono">{point.latitude.toFixed(8)}°</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-sm text-green-700 font-medium">Converted Longitude</p>
                        <p className="text-green-800 font-mono">{point.longitude.toFixed(8)}°</p>
                      </div>
                    </div>
                  )}

                  {/* UTM conversion display for WGS84 mode */}
                  {coordinateFormat === 'latlng' && point.latitude !== 0 && point.longitude !== 0 && (
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
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
                    </div>
                  )}

                  {/* Add Point button at the bottom of each point box */}
                  {index === points.length - 1 && points.length < 10 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        onClick={addPoint}
                        className="w-full"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Point
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

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
            {isPolygon && (
              <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">Polygon Area</p>
                <p className="text-xl font-mono text-yellow-900">{area.toFixed(2)} m²</p>
              </div>
            )}

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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
        </div>
      </div>
    </div>
  );
};

export default UTMConverter;
