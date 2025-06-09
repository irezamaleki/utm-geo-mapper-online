
import React, { useState, useEffect } from 'react';
import { Calculator, MapPin, Globe } from 'lucide-react';

const UTMConverter = () => {
  const [easting, setEasting] = useState('686989.37');
  const [northing, setNorthing] = useState('4046996.29');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

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
    
    console.log('Conversion details:', {
      input: { easting, northing },
      centralMeridian,
      x, y, M, mu, phi1: phi1 * 180 / Math.PI,
      output: { latDeg, lonDeg }
    });
    
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
        console.error('Conversion error:', error);
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
                    placeholder="686989.37"
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
                    placeholder="4046996.29"
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
              <p className="text-blue-700">X (Easting): 686989.37 m</p>
              <p className="text-blue-700">Y (Northing): 4046996.29 m</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Output (WGS84)</h4>
              <p className="text-green-700">Latitude: 36.55010145°</p>
              <p className="text-green-700">Longitude: 53.08918844°</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMConverter;
