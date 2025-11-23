
import React, { useState, useEffect } from 'react';
import { TelemetryPanel } from './TelemetryPanel';

export const SecurityPanel: React.FC = () => {
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'MODERATE' | 'HIGH'>('LOW');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [activeNodes, setActiveNodes] = useState(0);

  // Generate random encryption key simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setEncryptionKey(Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join(''));
      setActiveNodes(Math.floor(Math.random() * 5) + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TelemetryPanel title="NET_SECURITY">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <span>THREAT LVL:</span> 
            <span className={`font-bold ${threatLevel === 'LOW' ? 'text-green-400' : 'text-red-500'}`}>{threatLevel}</span>
        </div>
        <div className="flex justify-between items-center">
            <span>FIREWALL:</span> 
            <span className="text-cyan-300">ACTIVE</span>
        </div>
        <div className="flex justify-between items-center">
            <span>ENCRYPTION:</span> 
            <span className="text-cyan-200 font-mono text-[10px]">AES-256-GCM</span>
        </div>
        <div className="bg-cyan-900/20 p-1 rounded border border-cyan-500/20 mt-1">
            <div className="flex justify-between text-[9px] opacity-70 mb-1">
                <span>KEY_ROTATION</span>
                <span>{encryptionKey}</span>
            </div>
            <div className="w-full h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 animate-[scanline_2s_linear_infinite] w-1/2"></div>
            </div>
        </div>
        <div className="text-[10px] text-cyan-500/70 mt-1">
             {activeNodes} ACTIVE SECURE NODES
        </div>
      </div>
    </TelemetryPanel>
  );
};
