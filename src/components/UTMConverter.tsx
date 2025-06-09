
import React, { useState, useEffect } from 'react';
import { Calculator, MapPin, Globe } from 'lucide-react';

const UTMConverter = () => {
  const [easting, setEasting] = useState('687000.73');
  const [northing, setNorthing] = useState('4047011.07');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // UTM to WGS84 conversion function for Zone 39N
  const convertUTMToWGS84 = (easting: number, northing: number) => {
    // Constants for WGS84 ellipsoid
    const a = 6378137.0; // Semi-major axis
    const e2 = 0.00669437999014; // First eccentricity squared
    const k0 = 0.9996; // Scale factor
    
    // Zone 39N parameters
    const zone = 39;
    const centralMeridian = (zone - 1) * 6 - 180 + 3; // Central meridian for zone 39
    
    // Remove false easting and northing
    const x = easting - 500000;
    const y = northing;
    
    // Calculate meridional arc
    const M = y / k0;
    
    // Calculate footprint latitude
    const mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
    
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const J1 = 3 * e1 / 2 - 27 * e1 * e1 * e1 / 32;
    const J2 = 21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32;
    const J3 = 151 * e1 * e1 * e1 / 96;
    const J4 = 1097 * e1 * e1 * e1 * e1 / 512;
    
    const fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);
    
    // Calculate latitude and longitude
    const e1sq = e2 / (1 - e2);
    const C1 = e1sq * Math.cos(fp) * Math.cos(fp);
    const T1 = Math.tan(fp) * Math.tan(fp);
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(fp) * Math.sin(fp), 1.5);
    const N1 = a / Math.sqrt(1 - e2 * Math.sin(fp) * Math.sin(fp));
    const D = x / (N1 * k0);
    
    // Calculate latitude in radians
    const Q1 = N1 * Math.tan(fp) / R1;
    const Q2 = D * D / 2;
    const Q3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e1sq) * D * D * D * D / 24;
    const Q4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 1.6 * e1sq - 37 * e1sq * C1) * D * D * D * D * D * D / 720;
    
    const lat = fp - Q1 * (Q2 - Q3 + Q4);
    
    // Calculate longitude in radians
    const Q5 = D;
    const Q6 = (1 + 2 * T1 + C1) * D * D * D / 6;
    const Q7 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e1sq + 24 * T1 * T1) * D * D * D * D * D / 120;
    
    const lon = centralMeridian + (Q5 - Q6 + Q7) / Math.cos(fp);
    
    // Convert to degrees
    const latDeg = lat * 180 / Math.PI;
    const lonDeg = lon * 180 / Math.PI;
    
    return { latitude: latDeg, longitude: lonDeg };
  };

  useEffect(() => {
    const eastingNum = parseFloat(easting);
    const northingNum = parseFloat(northing);
    
    if (!isNaN(eastingNum) && !isNaN(northingNum) && easting.trim() !== '' && northing.trim() !== '') {
      try {
        const result = convertUTMToWGS84(eastingNum, northingNum);
        setLatitude(result.latitude.toFixed(8));
        setLongitude(result.longitude.toFixed(8));
      } catch (error) {
        setLatitude('Invalid input');
        setLongitude('Invalid input');
      }
    } else {
      setLatitude('');
      setLongitude('');
    }
  }, [easting, northing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Globe className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">UTM to WGS84 Converter</h1>
          </div>
          <p className="text-gray-600 text-lg">Convert UTM Zone 39N coordinates to WGS84 geographic coordinates</p>
        </div>

        {/* Main converter card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <Calculator className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-800">UTM Coordinates</h2>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-2">Zone: 39N | Datum: WGS 84</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X (Easting) - meters
                  </label>
                  <input
                    type="text"
                    value={easting}
                    onChange={(e) => setEasting(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="687000.73"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y (Northing) - meters
                  </label>
                  <input
                    type="text"
                    value={northing}
                    onChange={(e) => setNorthing(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="4047011.07"
                  />
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-semibold text-gray-800">WGS84 Coordinates</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 p-6 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Latitude (decimal degrees)
                  </label>
                  <div className="text-2xl font-mono text-green-800 bg-white p-3 rounded border">
                    {latitude || '---'}°
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Longitude (decimal degrees)
                  </label>
                  <div className="text-2xl font-mono text-green-800 bg-white p-3 rounded border">
                    {longitude || '---'}°
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Example Conversion</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Input (UTM Zone 39N)</h4>
              <p className="text-blue-700">X (Easting): 687000.73 m</p>
              <p className="text-blue-700">Y (Northing): 4047011.07 m</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Output (WGS84)</h4>
              <p className="text-green-700">Latitude: 36.55023238°</p>
              <p className="text-green-700">Longitude: 53.08931887°</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMConverter;
