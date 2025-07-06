
import React from 'react';
import { Globe, Calculator } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative text-center py-20 px-4">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent rounded-3xl" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <Globe className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-cal-sans leading-tight">
          UTM to WGS84
          <span className="block text-indigo-300">Converter</span>
        </h1>
        
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-inter leading-relaxed">
          Professional coordinate conversion with interactive mapping, 
          geometry calculations, and KML export capabilities.
        </p>
        
        <div className="flex items-center justify-center">
          <div className="p-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Calculator className="h-6 w-6 text-indigo-300 mx-4 my-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
