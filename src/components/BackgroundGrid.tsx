
import React from 'react';

const BackgroundGrid = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="0.5"
            />
            <circle
              cx="0"
              cy="0"
              r="1"
              fill="rgba(148, 163, 184, 0.2)"
            />
          </pattern>
          <pattern
            id="crosses"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 15 L 20 25 M 15 20 L 25 20"
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#crosses)" />
      </svg>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30" />
    </div>
  );
};

export default BackgroundGrid;
