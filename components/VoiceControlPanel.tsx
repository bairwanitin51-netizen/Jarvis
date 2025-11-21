

import React from 'react';
import { VoiceStatus } from '../services/jarvisService';
import { MicIcon } from './icons/MicIcon';
import { WaveformIcon } from './icons/WaveformIcon';

interface VoiceControlPanelProps {
  status: VoiceStatus;
  userTranscript: string;
  jarvisTranscript: string;
}

export const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({ status, userTranscript, jarvisTranscript }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'CONNECTING':
        return { text: 'Connecting to audio stream...', color: 'text-yellow-400', pulse: true, transcript: '' };
      case 'LISTENING':
        return { text: 'Listening...', color: 'text-green-400', pulse: true, transcript: userTranscript };
      case 'SPEAKING':
        return { text: 'J.A.R.V.I.S. is speaking...', color: 'text-cyan-400', pulse: false, transcript: jarvisTranscript };
      case 'ERROR':
        return { text: 'Audio connection error.', color: 'text-red-400', pulse: false, transcript: '' };
      case 'OFF':
      default:
        return { text: 'Voice mode inactive.', color: 'text-gray-500', pulse: false, transcript: '' };
    }
  };

  const { text, color, pulse, transcript } = getStatusInfo();

  const isSpeaking = status === 'SPEAKING';

  return (
    <div className="p-4 border-t border-cyan-500/30 flex flex-col items-center justify-center h-28 font-mono">
      <div className="flex items-center space-x-4">
        {isSpeaking ? (
          <WaveformIcon className={`w-8 h-8 ${color}`} />
        ) : (
          <MicIcon className={`w-8 h-8 ${color} ${pulse ? 'animate-pulse-glow' : ''}`} />
        )}
        <div>
          <p className={`text-lg ${color}`} style={{ textShadow: '0 0 5px currentColor' }}>{text}</p>
          <p className="text-sm text-gray-400 h-6 truncate">{transcript || ' '}</p>
        </div>
      </div>
    </div>
  );
};
