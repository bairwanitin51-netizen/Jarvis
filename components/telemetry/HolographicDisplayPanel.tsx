
import React, { useState } from 'react';
import { TelemetryPanel } from './TelemetryPanel';

// The main holographic display content
const HoloContent: React.FC = () => {
    // Increased particle count and randomized sizes for a more dynamic, ethereal effect.
    const particles = Array.from({ length: 30 }).map((_, i) => {
        const size = 1 + Math.random() * 2.5; // Random size between 1px and 3.5px
        return (
            <div 
                key={i} 
                className="holo-particle"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDelay: `${Math.random() * -10}s`, // Wider delay range for more randomness
                    animationDuration: `${5 + Math.random() * 5}s`, // Longer duration for slower, more graceful movement
                }}
            />
        );
    });

    return (
        <div className="relative w-full h-48 bg-black/40 border border-cyan-500/30 p-2 flex flex-col justify-center items-center overflow-hidden holo-container group">
            {/* Background grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 animate-grid" style={{ backgroundSize: '1rem 1rem' }}></div>
            
            {/* Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <div className="w-32 h-32 border border-cyan-500/50 rounded-full flex items-center justify-center relative animate-pulse-glow">
                    <div className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/50"></div>
                    <div className="absolute left-0 right-0 h-[1px] bg-cyan-500/50"></div>
                    <div className="w-24 h-24 border border-cyan-500/30 rounded-full border-dashed animate-spin" style={{ animationDuration: '10s' }}></div>
                </div>
            </div>

            {/* Particle System */}
            <div className="absolute inset-0 pointer-events-none">
                {particles}
            </div>
            
            {/* 3D Holographic Object */}
            <div className="w-full h-full flex items-center justify-center" style={{ animation: `float 8s ease-in-out infinite` }}>
                 <div className="holo-object">
                    <div className="holo-face holo-face-front animate-holographic-flicker" style={{ animationDuration: '3.2s', animationDelay: '-0.5s' }}><div className="holo-scanline"></div></div>
                    <div className="holo-face holo-face-back animate-holographic-flicker" style={{ animationDuration: '2.8s', animationDelay: '-1.2s' }}><div className="holo-scanline"></div></div>
                    <div className="holo-face holo-face-left animate-holographic-flicker" style={{ animationDuration: '3.5s', animationDelay: '-0.8s' }}><div className="holo-scanline"></div></div>
                    <div className="holo-face holo-face-right animate-holographic-flicker" style={{ animationDuration: '2.5s', animationDelay: '-1.5s' }}><div className="holo-scanline"></div></div>
                    <div className="holo-face holo-face-top animate-holographic-flicker" style={{ animationDuration: '3.0s', animationDelay: '-0.2s' }}><div className="holo-scanline"></div></div>
                    <div className="holo-face holo-face-bottom animate-holographic-flicker" style={{ animationDuration: '2.7s', animationDelay: '-2.0s' }}><div className="holo-scanline"></div></div>
                </div>
            </div>
            
             {/* Flickering text overlay */}
            <div className="absolute bottom-1 right-2 text-cyan-400 text-[10px] opacity-80 font-mono text-right">
                <p className="animate-pulse">MATRIX INTEGRITY: 99.8%</p>
                <p>DATA FLOW: 4.2 ZB/s</p>
            </div>
            <div className="absolute top-1 left-2 text-cyan-400 text-[10px] opacity-80 font-mono">
                <p>OBJECT: TESSERACT-4D</p>
                <p className="animate-pulse">STATE: STABLE</p>
            </div>
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>
        </div>
    );
};


export const HolographicDisplayPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TelemetryPanel title="HOLO-DIAGNOSTICS">
      {isExpanded ? (
        <div className="animate-fadeIn space-y-2">
            <HoloContent />
            <button
                onClick={() => setIsExpanded(false)}
                className="w-full text-center py-1 bg-red-900/30 border border-red-500/30 hover:bg-red-700/50 text-red-300 transition-colors text-[10px] tracking-widest"
            >
                TERMINATE VISUALIZER
            </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-center py-1 bg-cyan-900/30 border border-cyan-500/30 hover:bg-cyan-700/50 text-cyan-300 transition-colors text-[10px] tracking-widest"
        >
          INITIALIZE HOLOGRAM
        </button>
      )}
    </TelemetryPanel>
  );
};
