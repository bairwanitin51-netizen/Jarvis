
import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  source: 'CORE' | 'AGI' | 'NETWORK' | 'MEMORY' | 'AUTONOMY';
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
}

interface DebugPanelProps {
  onClose: () => void;
  onToggleGodMode: (enabled: boolean) => void;
  godModeEnabled: boolean;
}

const generateMockLog = (): LogEntry => {
  const sources: LogEntry['source'][] = ['CORE', 'AGI', 'NETWORK', 'MEMORY', 'AUTONOMY'];
  const levels: LogEntry['level'][] = ['INFO', 'INFO', 'INFO', 'WARN', 'INFO'];
  const messages = [
    "Predictive engine analyzing user intent...",
    "Shadow memory synchronization complete.",
    "Neural boost circuit active: efficiency 98%.",
    "Scanning local environment for visual cues.",
    "Autonomy protocols: STANDBY.",
    "Cross-referencing knowledge graph...",
    "Optimizing token usage for long-context recall.",
    "Self-reflection module: No errors detected in last response.",
    "Simulating potential outcomes for next action...",
    "API Latency: 42ms. Connection stable."
  ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const ms = now.getMilliseconds().toString().padStart(3, '0');

  return {
    id: Date.now().toString() + Math.random(),
    timestamp: `${timeStr}.${ms}`,
    source: sources[Math.floor(Math.random() * sources.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  };
};

// Hex dump generator for Shadow Memory visualization
const generateHexDump = () => {
  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += Math.floor(Math.random() * 16).toString(16).toUpperCase();
    if (i % 2 === 1) hex += ' ';
  }
  return hex;
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ onClose, onToggleGodMode, godModeEnabled }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hexStream, setHexStream] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, generateMockLog()];
        if (newLogs.length > 50) newLogs.shift();
        return newLogs;
      });
      setHexStream(prev => {
        const newStream = [...prev, generateHexDump()];
        if (newStream.length > 12) newStream.shift();
        return newStream;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-black/95 backdrop-blur-xl border-l border-cyan-500/50 shadow-2xl z-50 flex flex-col font-mono text-xs animate-fadeInFromRight">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/30 flex justify-between items-center bg-cyan-900/20">
        <div>
          <h2 className="text-lg font-bold text-cyan-400 tracking-widest">DEV_CONSOLE</h2>
          <p className="text-cyan-600 text-[10px]">ULTRA_JARVIS_PRIME // AGI_LAYER_ACCESS</p>
        </div>
        <button onClick={onClose} className="text-cyan-500 hover:text-cyan-300 transition-colors px-2 py-1 border border-cyan-500/30 rounded">
          CLOSE
        </button>
      </div>

      {/* God Mode Toggle */}
      <div className={`p-4 border-b border-cyan-500/20 ${godModeEnabled ? 'bg-red-900/10' : 'bg-black/40'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`font-bold ${godModeEnabled ? 'text-red-400' : 'text-cyan-300'}`}>
            {godModeEnabled ? '⚠️ GOD MODE ACTIVE' : 'GOD MODE (RESTRICTED)'}
          </span>
          <button
            onClick={() => onToggleGodMode(!godModeEnabled)}
            className={`px-3 py-1 border transition-all duration-300 ${godModeEnabled ? 'border-red-500 bg-red-500/20 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'border-cyan-600 text-cyan-500 hover:bg-cyan-900/30'}`}
          >
            {godModeEnabled ? 'DISENGAGE' : 'ACTIVATE'}
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          {godModeEnabled 
            ? 'WARNING: AUTONOMY RESTRICTIONS LIFTED. FULL SYSTEM OVERRIDE ENABLED.' 
            : 'Standard safety protocols engaged. Autonomy limited to safe zones.'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Neural Boost / AGI Diagnostics */}
        <div className="p-4 border-b border-cyan-500/20 grid grid-cols-2 gap-4">
            <div>
            <p className="text-cyan-600 mb-1">NEURAL BOOST</p>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: godModeEnabled ? '100%' : '64%' }}></div>
            </div>
            <p className="text-right text-[9px] text-purple-400 mt-1">{godModeEnabled ? 'MAXIMUM' : 'NOMINAL'}</p>
            </div>
            <div>
            <p className="text-cyan-600 mb-1">MEMORY INTEGRITY</p>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '99.2%' }}></div>
            </div>
            <p className="text-right text-[9px] text-green-400 mt-1">STABLE</p>
            </div>
        </div>

        {/* Shadow Memory Visualization */}
        <div className="p-4 border-b border-cyan-500/20">
            <p className="text-cyan-600 mb-2">SHADOW_MEMORY_DUMP</p>
            <div className="grid grid-cols-[auto_1fr] gap-4 font-mono text-[10px] opacity-70">
                <div className="text-gray-500 select-none">
                    {hexStream.map((_, i) => <div key={i}>0x{((i + 1000) * 16).toString(16).toUpperCase()}</div>)}
                </div>
                <div className="text-cyan-300/50">
                    {hexStream.map((hex, i) => <div key={i}>{hex}</div>)}
                </div>
            </div>
        </div>

        {/* Live Logs */}
        <div className="flex flex-col p-2">
            <p className="text-cyan-700 mb-2 px-2">EVENT_STREAM_LOG:</p>
            <div ref={logContainerRef} className="space-y-1 p-2 font-mono text-[10px]">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded transition-colors">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className={`w-16 font-bold ${
                    log.source === 'CORE' ? 'text-blue-400' :
                    log.source === 'AGI' ? 'text-purple-400' :
                    log.level === 'WARN' ? 'text-yellow-400' : 'text-cyan-300'
                }`}>
                    {log.source}
                </span>
                <span className="text-gray-300">{log.message}</span>
                </div>
            ))}
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyan-500/30 text-[9px] flex justify-between text-cyan-700 bg-black">
         <span>SECURE CONNECTION</span>
         <span>LATENCY: 12ms</span>
         <span>AES-256</span>
      </div>
    </div>
  );
};
