import React, { useState, useEffect } from 'react';
import { TelemetryPanel } from './TelemetryPanel';

interface MeterProps {
  label: string;
  value: number; // 0-100
}

const Meter: React.FC<MeterProps> = ({ label, value }) => {
  const displayValue = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between items-center text-cyan-300/80">
        <span>{label}</span>
        <span>{displayValue.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 bg-cyan-800/50 rounded-full overflow-hidden mt-1">
        <div 
          className="h-full bg-cyan-400 transition-all duration-500 ease-in-out" 
          style={{ width: `${displayValue}%`, textShadow: '0 0 4px #00ffff' }}
        ></div>
      </div>
    </div>
  );
};

const initialMeters = [
  { id: 'shield', label: 'SHIELD CAP.', value: 75, base: 75, range: 10 },
  { id: 'repulsor', label: 'REPULSOR PWR.', value: 90, base: 90, range: 5 },
  { id: 'weapons', label: 'WEAPONS CHG.', value: 40, base: 40, range: 20 },
  { id: 'life', label: 'LIFE SUPPORT', value: 99, base: 99, range: 2 },
];

export const ResourceMetersPanel: React.FC = () => {
  const [meters, setMeters] = useState(initialMeters);

  useEffect(() => {
    const interval = setInterval(() => {
      setMeters(prevMeters => 
        prevMeters.map(meter => ({
          ...meter,
          value: meter.base + (Math.random() * meter.range) - (meter.range / 2)
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TelemetryPanel title="RESOURCE METERS">
      <div className="space-y-3">
        {meters.map(meter => (
          <Meter key={meter.id} label={meter.label} value={meter.value} />
        ))}
      </div>
    </TelemetryPanel>
  );
};
