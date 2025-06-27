
import { convertWGS84ToUTM } from './coordinateConversions';

export interface Point {
  id: string;
  easting: string;
  northing: string;
  latitude: number;
  longitude: number;
  label: string;
}

// Generate alphabetical labels
export const generateLabel = (index: number): string => {
  return String.fromCharCode(65 + index); // A, B, C, D, ...
};

// Improved KML parsing function
export const parseKMLContent = (kmlContent: string): Point[] => {
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
