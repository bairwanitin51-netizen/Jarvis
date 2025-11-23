
import React from 'react';
import { VoiceStatus } from '../services/jarvisService';
import { HolographicCore } from './HolographicCore';
import { KeyboardIcon } from './icons/KeyboardIcon';
import { CamIcon } from './icons/CamIcon';
import { MicIcon } from './icons/MicIcon';
import { PauseIcon } from './icons/PauseIcon';
import { UploadIcon } from './icons/UploadIcon';
import { GeminiSparkleIcon } from './icons/GeminiSparkleIcon';

interface LiveInterfaceProps {
  voiceStatus: VoiceStatus;
  jarvisTranscript: string;
  userTranscript: string;
  onClose: () => void;
  onToggleMic: () => void;
}

export const LiveInterface: React.FC<LiveInterfaceProps> = ({
  voiceStatus,
  jarvisTranscript,
  userTranscript,
  onClose,
  onToggleMic
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col animate-fadeIn overflow-hidden font-sans">
      {/* Background: Dark top, Soft Blue Gradient Bottom */}
      <div className="absolute inset-0 bg-gray-950"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1c2e4a] via-[#111827] to-transparent opacity-80 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 mt-2">
        <div className="flex items-center gap-2 text-gray-200 opacity-90">
           <GeminiSparkleIcon className="w-6 h-6" />
           <span className="text-lg font-normal tracking-wide text-gray-300">Live</span>
        </div>
        <button 
          onClick={onClose}
          className="p-3 text-white hover:bg-white/10 transition-colors rounded-full"
          title="Switch to Keyboard"
        >
          <KeyboardIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Main Visualizer Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 pb-20">
        <HolographicCore 
          voiceStatus={voiceStatus}
          jarvisTranscript={jarvisTranscript}
          userTranscript={userTranscript}
          variant="minimal"
        />
      </main>

      {/* Bottom Floating Controls (Rounded Rectangle) */}
      <footer className="absolute bottom-10 left-0 right-0 z-30 flex justify-center w-full">
        <div className="flex items-center gap-4 bg-[#1e1e1e] px-6 py-3 rounded-full shadow-2xl border border-white/5">
           
           {/* Button 1: Camera */}
           <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white transition-colors">
              <CamIcon className="w-6 h-6" />
           </button>
           
           {/* Button 2: Share/Upload */}
           <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white transition-colors">
               <UploadIcon className="w-6 h-6" />
           </button>

           {/* Button 3: Pause (Visual Placeholder for Mic Toggle currently) */}
           <button 
              onClick={onToggleMic}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white transition-colors"
           >
               {/* Toggling between Pause and Mic based on status interpretation */}
               {voiceStatus === 'LISTENING' || voiceStatus === 'SPEAKING' ? (
                   <PauseIcon className="w-6 h-6" />
               ) : (
                   <MicIcon className="w-6 h-6" />
               )}
           </button>

           {/* Button 4: Close (Red X) */}
           <button 
              onClick={onClose}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors ml-2"
           >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
           </button>
        </div>
      </footer>
    </div>
  );
};
