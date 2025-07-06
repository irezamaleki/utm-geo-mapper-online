
import React from 'react';
import { Upload } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import JSZip from 'jszip';
import { parseKMLContent, Point } from '@/utils/kmlParser';

interface FileUploadSectionProps {
  onPointsLoaded: (points: Point[]) => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ onPointsLoaded }) => {
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
          onPointsLoaded(parsedPoints);
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

    event.target.value = '';
  };

  return (
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
        className="absolute top-0 right-0 p-2 bg-gray-100 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors duration-200 group"
        title="Upload KML/KMZ file"
      >
        <Upload className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" />
      </Label>
    </div>
  );
};

export default FileUploadSection;
