
import React from 'react';
import { Globe } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-gray-900 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 font-cal-sans">
              UTM Converter
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-gray-900 font-inter">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 font-inter">Documentation</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 font-inter">Support</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
