
import { convertWGS84ToUTM } from './coordinateConversions';

// Function to calculate distance between two lat/lng points in meters
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Corrected polygon area calculation using UTM coordinates
export const calculatePolygonArea = (coords: [number, number][]): number => {
  if (coords.length < 4) return 0; // Need at least 4 points for a polygon
  
  // Convert coordinates to UTM for accurate area calculation
  const utmCoords = coords.map(([lat, lon]) => {
    const utm = convertWGS84ToUTM(lat, lon);
    return [utm.easting, utm.northing];
  });
  
  // Use shoelace formula with UTM coordinates
  let area = 0;
  const n = utmCoords.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += utmCoords[i][0] * utmCoords[j][1];
    area -= utmCoords[j][0] * utmCoords[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  console.log('Area calculation:', {
    coords: coords,
    utmCoords: utmCoords,
    calculatedArea: area
  });
  
  return area;
};
