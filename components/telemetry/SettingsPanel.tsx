
import React from 'react';
import { TelemetryPanel } from './TelemetryPanel';
import { JarvisSettings } from '../../types';

interface SettingsPanelProps {
  settings: JarvisSettings;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings }) => {
  return (
    <TelemetryPanel title="SYSTEM_VARIABLES">
      <div className="space-y-3">
        {/* Personality Sarcasm Bar */}
        <div>
            <div className="flex justify-between text-[10px] text-cyan-500 mb-1">
                <span>PERSONALITY (SARCASM)</span>
                <span>{settings.sarcasmLevel}%</span>
            </div>
            <div className="w-full h-1.5 bg-cyan-900/50 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${settings.sarcasmLevel > 80 ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}`}
                    style={{ width: `${settings.sarcasmLevel}%` }}
                ></div>
            </div>
        </div>

        {/* Voice Speed */}
        <div className="flex justify-between items-center">
            <span>VOICE_SPEED:</span>
            <span className="text-cyan-300 font-mono">{settings.voiceSpeed.toFixed(1)}x</span>
        </div>

         {/* Security Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
            <div className={`border ${settings.vpnStatus === 'ACTIVE' ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50'} p-1 text-center rounded`}>
                <span className="block text-[9px] opacity-70">VPN_TUNNEL</span>
                <span className={`font-bold ${settings.vpnStatus === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>{settings.vpnStatus}</span>
            </div>
             <div className="border border-cyan-500/30 bg-cyan-900/10 p-1 text-center rounded">
                <span className="block text-[9px] opacity-70">THEME</span>
                <span className="font-bold text-cyan-300">{settings.theme}</span>
            </div>
        </div>
      </div>
    </TelemetryPanel>
  );
};
