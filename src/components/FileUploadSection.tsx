
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

    // Reset file input
    event.target.value = '';
  };

  return (
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
  );
};

export default FileUploadSection;
