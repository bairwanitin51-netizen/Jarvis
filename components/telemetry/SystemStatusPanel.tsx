
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
  const groqLatency = useFluctuatingValue(0.12, 0.05, 800);
  const gptLogic = useFluctuatingValue(98, 2, 3000);
  const veoCore = useFluctuatingValue(100, 0, 5000);
  const geminiVision = useFluctuatingValue(99, 1, 2000);

  return (
    <TelemetryPanel title="HYBRID_OMNI_CORE">
      <div className="space-y-1">
        <div className="flex justify-between">
            <span>STATUS:</span> <span className="text-green-400 font-bold">OPTIMAL</span>
        </div>
        <div className="h-px bg-cyan-500/20 my-1"></div>
        <div className="flex justify-between">
            <span>GROQ_SPEED:</span> <span className="text-cyan-300">{groqLatency.toFixed(3)}s</span>
        </div>
        <div className="flex justify-between">
            <span>GPT_LOGIC:</span> <span className="text-cyan-300">{gptLogic.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
            <span>GEMINI_VIS:</span> <span className="text-cyan-300">{geminiVision.toFixed(0)}%</span>
        </div>
         <div className="flex justify-between">
            <span>VEO_3.1:</span> <span className="text-purple-400 font-bold animate-pulse">STANDBY</span>
        </div>
      </div>
    </TelemetryPanel>
  );
};
