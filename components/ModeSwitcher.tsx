
import React from 'react';
import { AppMode } from '../types';

interface ModeSwitcherProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, setMode }) => {
  const isTextMode = mode === AppMode.TEXT;

  return (
    <div className="flex items-center border border-cyan-500/30 text-xs font-mono">
      <button
        onClick={() => setMode(AppMode.TEXT)}
        className={`px-3 py-1 transition-colors ${isTextMode ? 'bg-cyan-500/30 text-cyan-200' : 'text-cyan-500 hover:bg-cyan-500/20'}`}
      >
        TEXT
      </button>
      <button
        onClick={() => setMode(AppMode.VOICE)}
        className={`px-3 py-1 transition-colors ${!isTextMode ? 'bg-cyan-500/30 text-cyan-200' : 'text-cyan-500 hover:bg-cyan-500/20'}`}
      >
        VOICE
      </button>
    </div>
  );
};
