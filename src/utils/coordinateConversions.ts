
// Coordinate conversion utilities for UTM Zone 39N and WGS84

export const convertUTMToWGS84 = (easting: number, northing: number) => {
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

export const convertWGS84ToUTM = (lat: number, lng: number) => {
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
