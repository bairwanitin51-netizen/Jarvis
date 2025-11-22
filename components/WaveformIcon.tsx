
import React from 'react';

export const WaveformIcon: React.FC<{ className?: string }> = ({ className }) => {
  const bars = [
    { duration: '1s', delay: '0s' },
    { duration: '0.8s', delay: '-0.2s' },
    { duration: '1.2s', delay: '-0.5s' },
    { duration: '0.9s', delay: '-0.3s' },
    { duration: '1.1s', delay: '-0.1s' },
  ];

  return (
    <div className={`flex items-center justify-center space-x-0.5 h-full ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className="w-1 bg-current"
          style={{
            animation: `live-waveform ${bar.duration} ease-in-out infinite`,
            animationDelay: bar.delay,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
};
