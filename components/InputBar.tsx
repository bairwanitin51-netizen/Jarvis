
import React, { useState } from 'react';
import { SendIcon } from './icons/SendIcon';
import { MicIcon } from './icons/MicIcon';
import { Protocol } from '../types';
import type { VoiceStatus } from '../services/jarvisService';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  protocol: Protocol;
  voiceStatus: VoiceStatus;
  onToggleVoice: () => void;
  userTranscript: string;
  jarvisTranscript: string;
}

const HolographicVoiceDisplay: React.FC<{ status: VoiceStatus; transcript: string }> = ({ status, transcript }) => {
  const bars = Array.from({ length: 30 });
  const isSpeaking = status === 'SPEAKING';
  const colorClass = isSpeaking ? 'bg-cyan-400' : 'bg-green-400';

  let statusText = '';
  if (status === 'CONNECTING') statusText = 'CONNECTING...';
  if (status === 'LISTENING') statusText = 'LISTENING...';
  if (status === 'SPEAKING') statusText = 'J.A.R.V.I.S. RESPONDING...';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
      <div className="flex items-center justify-center space-x-0.5 h-full w-full max-w-md">
        {bars.map((_, index) => (
          <div
            key={index}
            className={`w-1 ${colorClass}`}
            style={{
              animation: `live-waveform ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * -0.5}s`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
       <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <p className="font-mono text-sm tracking-widest opacity-80" style={{ textShadow: `0 0 5px ${isSpeaking ? '#00ffff' : '#00ff00'}` }}>{statusText}</p>
        <p className="w-full truncate px-4 text-xs opacity-70">{transcript}</p>
      </div>
    </div>
  );
};


export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isLoading,
  protocol,
  voiceStatus,
  onToggleVoice,
  userTranscript,
  jarvisTranscript
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const isVoiceActive = voiceStatus === 'LISTENING' || voiceStatus === 'SPEAKING' || voiceStatus === 'CONNECTING';

  const protocolStyles = {
    [Protocol.NORMAL]: 'border-cyan-500/30 text-cyan-300',
    [Protocol.VERONICA]: 'border-red-500/50 text-red-300',
    [Protocol.HOUSE_PARTY]: 'border-yellow-500/50 text-yellow-300',
    [Protocol.CLEAN_SLATE]: 'border-cyan-500/30 text-cyan-300',
    [Protocol.SILENT_NIGHT]: 'border-gray-600/50 text-gray-400',
  };

  const buttonStyles = {
    [Protocol.NORMAL]: 'bg-cyan-600/50 hover:bg-cyan-500/80 text-cyan-200',
    [Protocol.VERONICA]: 'bg-red-600/50 hover:bg-red-500/80 text-red-200',
    [Protocol.HOUSE_PARTY]: 'bg-yellow-600/50 hover:bg-yellow-500/80 text-yellow-200',
    [Protocol.CLEAN_SLATE]: 'bg-cyan-600/50 hover:bg-cyan-500/80 text-cyan-200',
    [Protocol.SILENT_NIGHT]: 'bg-gray-600/50 hover:bg-gray-500/80 text-gray-200',
  };
  
  const currentBorderStyle = protocolStyles[protocol].split(' ')[0];
  const currentTextColor = protocolStyles[protocol].split(' ')[1];

  const transcript = voiceStatus === 'SPEAKING' ? jarvisTranscript : userTranscript;

  return (
    <div className={`p-4 border-t ${currentBorderStyle} transition-all duration-300`}>
      <div className="flex items-center space-x-4 relative">
        <div className={`absolute -left-px -top-px w-3 h-3 border-l-2 border-t-2 ${currentBorderStyle}`}></div>
        <div className={`absolute -right-px -top-px w-3 h-3 border-r-2 border-t-2 ${currentBorderStyle}`}></div>
        <div className={`absolute -left-px -bottom-px w-3 h-3 border-l-2 border-b-2 ${currentBorderStyle}`}></div>
        <div className={`absolute -right-px -bottom-px w-3 h-3 border-r-2 border-b-2 ${currentBorderStyle}`}></div>
        
        <div className="relative w-full h-[52px]">
           <form onSubmit={handleSubmit} className="w-full h-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Awaiting input, Sir..."
              disabled={isLoading || isVoiceActive}
              className={`w-full h-full p-3 bg-transparent placeholder-gray-500 focus:outline-none transition-opacity duration-300 ${currentTextColor} ${isVoiceActive ? 'opacity-0' : 'opacity-100'}`}
              style={{ textShadow: '0 0 5px currentColor' }}
            />
          </form>
          {isVoiceActive && <HolographicVoiceDisplay status={voiceStatus} transcript={transcript} />}
        </div>
        
        <button
          type="button"
          onClick={onToggleVoice}
          disabled={isLoading && !isVoiceActive}
          className={`p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            isVoiceActive 
            ? 'bg-red-600/70 hover:bg-red-500/90 text-red-100 animate-pulse-glow' 
            : buttonStyles[protocol]
          }`}
        >
          <MicIcon className="w-6 h-6" />
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || isVoiceActive}
          className={`p-3 rounded-full transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles[protocol]}`}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};