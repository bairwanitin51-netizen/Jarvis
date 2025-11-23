import React, { useEffect, useState } from 'react';
import { VoiceStatus } from '../services/jarvisService';

interface HolographicCoreProps {
  voiceStatus: VoiceStatus;
  jarvisTranscript: string;
  userTranscript: string;
  variant?: 'default' | 'minimal';
}

export const HolographicCore: React.FC<HolographicCoreProps> = ({ 
  voiceStatus, 
  jarvisTranscript, 
  userTranscript,
  variant = 'default'
}) => {
  const isVoiceActive = voiceStatus === 'LISTENING' || voiceStatus === 'SPEAKING' || voiceStatus === 'CONNECTING';
  const isSpeaking = voiceStatus === 'SPEAKING';
  const isMinimal = variant === 'minimal';
  
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Visual state for "High Density" data
  const [hexDump, setHexDump] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHexDump(prev => {
        const next = [...prev, Math.random().toString(16).substr(2, 8).toUpperCase()];
        if (next.length > 8) next.shift();
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Dynamic Color Logic based on Voice Status
  const getCoreColor = () => {
      switch(voiceStatus) {
          case 'SPEAKING': return 'text-cyan-400 border-cyan-500 shadow-cyan-500/50';
          case 'LISTENING': return 'text-green-400 border-green-500 shadow-green-500/50';
          case 'CONNECTING': return 'text-yellow-400 border-yellow-500 shadow-yellow-500/50';
          case 'ERROR': return 'text-red-600 border-red-600 shadow-red-600/50';
          default: return 'text-cyan-800 border-cyan-900/30 shadow-cyan-900/20';
      }
  };

  const getParticleColor = () => {
      switch(voiceStatus) {
          case 'SPEAKING': return 'bg-cyan-400';
          case 'LISTENING': return 'bg-green-400';
          case 'CONNECTING': return 'bg-yellow-400';
          case 'ERROR': return 'bg-red-600';
          default: return 'bg-cyan-800';
      }
  }

  const coreColorClass = getCoreColor();
  const particleColorClass = getParticleColor();

  return (
    <div className={`w-full relative overflow-hidden transition-colors duration-700 flex flex-col items-center justify-center group ${isMinimal ? 'bg-transparent h-full' : 'aspect-video bg-black/90 border-b-4 border-cyan-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] mb-4'}`}>
       {/* --- Background Grid & Vignette (Only in Default) --- */}
       {!isMinimal && (
           <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)] z-10"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-grid" style={{ backgroundSize: '3rem 3rem' }}></div>
           </>
       )}
       
       {/* --- Peripheral Data HUDs (Only in Default) --- */}
       {!isMinimal && (
        <>
           <div className="absolute left-4 top-1/2 -translate-y-1/2 w-48 hidden lg:block opacity-80 z-20 font-mono text-[10px] text-cyan-500">
              <div className={`border-l-2 pl-4 space-y-4 transition-colors duration-500 ${voiceStatus === 'LISTENING' ? 'border-green-500' : 'border-cyan-500/30'}`}>
                 <div>
                    <p className="tracking-[0.3em] text-xs font-bold text-cyan-100 mb-1">SYS_ANALYSIS</p>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full animate-[scanline_2s_ease-in-out_infinite] w-2/3 ${particleColorClass}`}></div></div>
                 </div>
                 <div className="pt-2 border-t border-dashed border-cyan-500/20">
                    {hexDump.map((hex, i) => (
                        <div key={i} className="flex justify-between text-[9px] text-cyan-600 font-bold">
                            <span>0x{i}F</span>
                            <span className="text-cyan-400">{hex}</span>
                        </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 hidden lg:block opacity-80 z-20 font-mono text-[10px] text-right text-cyan-500">
              <div className={`border-r-2 pr-4 space-y-4 transition-colors duration-500 ${voiceStatus === 'SPEAKING' ? 'border-cyan-400' : 'border-cyan-500/30'}`}>
                 <div>
                    <p className="tracking-[0.3em] text-xs font-bold text-cyan-100 mb-1">CORE_PROCESS</p>
                    <p className={`text-xs font-bold animate-pulse ${isVoiceActive ? 'text-white' : 'text-cyan-700'}`}>
                        {voiceStatus === 'OFF' ? 'STANDBY' : voiceStatus}
                    </p>
                 </div>
                 <div className="flex flex-col items-end gap-1 mt-2 opacity-70">
                    <div className={`w-24 h-[2px] ${particleColorClass}`}></div>
                    <div className={`w-16 h-[2px] ${particleColorClass}`}></div>
                 </div>
                 <div className="pt-4 text-cyan-400 font-bold">
                     <p>TEMP: <span className="text-white">{(45 + Math.random() * 5).toFixed(1)}°C</span></p>
                     <p>VOLT: <span className="text-white">{(12 + Math.random()).toFixed(2)}V</span></p>
                 </div>
              </div>
           </div>
        </>
       )}

       {/* --- CENTRAL CORE VISUALIZATION --- */}
       <div className={`relative z-30 flex items-center justify-center ${isMinimal ? 'w-96 h-96' : 'w-80 h-80'}`}>
            {/* Outer Spinning Data Ring */}
            <div className={`absolute inset-0 rounded-full border border-dashed opacity-40 animate-[spin_30s_linear_infinite] ${voiceStatus === 'ERROR' ? 'border-red-500' : 'border-cyan-400'}`}></div>
            
            {/* Middle Fast Ring */}
            <div className={`absolute inset-8 rounded-full border-2 border-transparent border-t-current border-b-current opacity-60 animate-[spin_5s_linear_infinite] ${isSpeaking ? 'text-cyan-300' : 'text-cyan-800'}`}></div>

            {/* The Core Sphere */}
            <div className={`relative w-40 h-40 rounded-full transition-all duration-500 flex items-center justify-center ${coreColorClass} ${isSpeaking ? 'scale-110 shadow-[0_0_80px_currentColor]' : 'shadow-[0_0_30px_currentColor]'}`}>
                {/* Core Surface Texture */}
                <div className={`absolute inset-0 bg-current opacity-10 rounded-full animate-pulse`}></div>
                <div className="absolute inset-0 border border-white/10 rounded-full"></div>
                
                {/* Internal Reactor Plasma */}
                <div className="absolute inset-2 overflow-hidden rounded-full opacity-80">
                    <div className={`absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,currentColor_20deg,transparent_50deg)] animate-[spin_2s_linear_infinite] blur-md`}></div>
                </div>

                {/* Voice Waveform Visualizer (Central) */}
                {isVoiceActive && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1 z-40">
                         {[...Array(7)].map((_, i) => (
                             <div 
                                key={i} 
                                className={`w-1.5 bg-white shadow-[0_0_10px_white] rounded-full transition-all duration-75 ease-in-out ${isSpeaking ? 'animate-[live-waveform_0.4s_ease-in-out_infinite]' : 'h-1.5 animate-pulse'}`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                             ></div>
                         ))}
                    </div>
                )}
            </div>

            {/* Floating Particles / "Solar Flares" */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i}
                        className={`absolute top-1/2 left-1/2 w-1 h-1 ${particleColorClass} rounded-full shadow-[0_0_10px_currentColor]`}
                        style={{
                            transform: `rotate(${i * 60 + rotation}deg) translateX(${isMinimal ? 130 + Math.random() * 20 : 100 + Math.random() * 20}px)`,
                            opacity: Math.random() > 0.5 ? 1 : 0,
                            transition: 'all 0.2s'
                        }}
                    ></div>
                ))}
            </div>
       </div>

       {/* --- Status Text & Transcript --- */}
       <div className={`absolute left-0 right-0 text-center z-30 pointer-events-none ${isMinimal ? 'bottom-32' : 'bottom-8'}`}>
           {!isMinimal && (
               <div className={`inline-block px-6 py-1 border backdrop-blur-md rounded-full mb-4 transition-colors duration-500 ${voiceStatus === 'ERROR' ? 'bg-red-900/50 border-red-500' : 'bg-cyan-900/40 border-cyan-500/50'}`}>
                   <p className={`font-mono text-xs tracking-[0.3em] font-bold ${isSpeaking ? 'text-white animate-pulse' : 'text-cyan-300'}`}>
                       {voiceStatus === 'OFF' ? 'SYSTEM OFFLINE' : `PROTOCOL: ${voiceStatus}`}
                   </p>
               </div>
           )}
           
           {(userTranscript || jarvisTranscript) && (
               <div className={`max-w-3xl mx-auto px-6 py-2 ${isMinimal ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm border-t border-b border-cyan-500/10'}`}>
                   <p className={`font-mono leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isMinimal ? 'text-xl text-white/90' : 'text-sm text-cyan-50'}`}>
                       {isSpeaking ? (
                           <span className="text-cyan-200">{jarvisTranscript}</span>
                       ) : (
                           <span className="text-white">{userTranscript}</span>
                       )}
                   </p>
               </div>
           )}
       </div>
    </div>
  );
};