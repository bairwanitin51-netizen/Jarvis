
import React, { useState, useEffect } from 'react';
import { TelemetryPanel } from './TelemetryPanel';

const useFluctuatingValue = (base: number, range: number, delay: number) => {
  const [value, setValue] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(base + (Math.random() * range) - (range / 2));
    }, delay);
    return () => clearInterval(interval);
  }, [base, range, delay]);

  return value;
};

export const SystemStatusPanel: React.FC = () => {
  const cpuLoad = useFluctuatingValue(35, 10, 2000);
  const memUsage = useFluctuatingValue(58, 5, 3000);
  const uplinkSpeed = useFluctuatingValue(1.21, 0.5, 2500);
  const neuralLoad = useFluctuatingValue(72, 15, 1500);

  return (
    <TelemetryPanel title="SYSTEM STATUS">
      <div className="space-y-1">
        <div className="flex justify-between">
            <span>STATUS:</span> <span className="text-green-400 font-bold">ONLINE</span>
        </div>
        <div className="flex justify-between">
            <span>AGI CORE:</span> <span className="text-purple-400 font-bold animate-pulse">ACTIVE</span>
        </div>
        <div className="h-px bg-cyan-500/20 my-1"></div>
        <div className="flex justify-between">
            <span>CPU LOAD:</span> <span className="text-cyan-300">{cpuLoad.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
            <span>NEURAL:</span> <span className="text-cyan-300">{neuralLoad.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
            <span>MEM USAGE:</span> <span className="text-cyan-300">{memUsage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
            <span>UPLINK:</span> <span className="text-cyan-300">{uplinkSpeed.toFixed(2)} GW</span>
        </div>
      </div>
    </TelemetryPanel>
  );
};
