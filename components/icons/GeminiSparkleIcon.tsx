import React from 'react';

export const GeminiSparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
    <path 
      d="M12 3C12 3 14 8 19 8C14 8 12 13 12 13C12 13 10 8 5 8C10 8 12 3 12 3Z" 
      fill="url(#geminiGradient)" 
      className="animate-pulse-glow"
    />
    <path 
      d="M16.5 14.5C16.5 14.5 17.5 16.5 19.5 16.5C17.5 16.5 16.5 18.5 16.5 18.5C16.5 18.5 15.5 16.5 13.5 16.5C15.5 16.5 16.5 14.5 16.5 14.5Z" 
      fill="url(#geminiGradient)" 
      opacity="0.8"
    />
    {/* Waveform visual hint inside/near the star */}
    <path 
        d="M4 12C4 12 6 9 8 12C10 15 12 12 12 12" 
        stroke="url(#geminiGradient)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        className="opacity-70"
    />
  </svg>
);