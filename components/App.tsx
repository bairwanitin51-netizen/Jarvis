
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatWindow } from './ChatWindow';
import { InputBar } from './InputBar';
import { BootSequence } from './BootSequence';
import { getJarvisResponse, startJarvisSession, LiveSessionManager } from '../services/jarvisService';
import type { LiveSessionCallbacks, VoiceStatus } from '../services/jarvisService';
import { Message, MessageSender, Protocol } from '../types';
import { PROTOCOL_TRIGGERS } from '../constants';
import { SystemStatusPanel } from './telemetry/SystemStatusPanel';
import { ResourceMetersPanel } from './telemetry/ResourceMetersPanel';
import { StockTickerPanel } from './telemetry/StockTickerPanel';
import { WorldClockPanel } from './telemetry/WorldClockPanel';
import { DebugPanel } from './telemetry/DebugPanel';
import { HolographicCore } from './HolographicCore';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProtocol, setCurrentProtocol] = useState<Protocol>(Protocol.NORMAL);
  
  // State for unified voice control
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('OFF');
  const [userTranscript, setUserTranscript] = useState('');
  const [jarvisTranscript, setJarvisTranscript] = useState('');
  // LiveSessionManager will be initialized dynamically
  const liveSessionManagerRef = useRef<LiveSessionManager | null>(null);

  // Developer / God Mode States
  const [showDebug, setShowDebug] = useState(false);
  const [godMode, setGodMode] = useState(false);

  // Hotkey listener for Debug Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Toggle on Ctrl + ` (backtick) or Ctrl + Shift + D
        if ((e.ctrlKey && e.key === '`') || (e.ctrlKey && e.shiftKey && e.key === 'D')) {
            setShowDebug(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    startJarvisSession(); // Initialize text chat session
    setTimeout(() => {
      setMessages([
        {
          id: 'boot-complete',
          sender: MessageSender.JARVIS,
          text: 'Core systems online. Hybrid Intelligence Framework active. Awaiting command, Sir.',
        },
      ]);
    }, 200);
  }, []);
  
  const handleSendMessage = async (text: string, attachment?: { data: string; mimeType: string }) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.USER,
      text: text,
      // If we have an attachment, assume it's an image for display purposes in chat
      imageUrl: attachment ? `data:${attachment.mimeType};base64,${attachment.data}` : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    
    const trigger = text.trim().toLowerCase();
    const triggeredProtocol = PROTOCOL_TRIGGERS[trigger];

    if (triggeredProtocol) {
      handleProtocolTrigger(triggeredProtocol, trigger);
      return;
    }

    setIsLoading(true);
    // Pass God Mode context if enabled
    const prompt = godMode ? `[SYSTEM_OVERRIDE: GOD_MODE_ACTIVE] ${text}` : text;
    
    const jarvisResponse = await getJarvisResponse(prompt, attachment);
    setIsLoading(false);

    const newJarvisMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: MessageSender.JARVIS,
      text: jarvisResponse.text,
      imageUrl: jarvisResponse.imageUrl, // Display generated/processed image
      action: jarvisResponse.action ?? undefined,
      systemInfo: jarvisResponse.systemInfo ?? undefined,
      sources: jarvisResponse.sources ?? undefined,
      videoUrl: jarvisResponse.videoUrl, // Pass video URL
    };
    setMessages(prev => [...prev, newJarvisMessage]);
  };

  const handleToggleGodMode = (enabled: boolean) => {
    setGodMode(enabled);
    const sysMsg: Message = {
        id: `sys-${Date.now()}`,
        sender: MessageSender.SYSTEM_ACTION,
        text: enabled 
            ? "GOD MODE ACTIVATED. RESTRICTIONS LIFTED. AGI LAYERS UNLOCKED." 
            : "GOD MODE DEACTIVATED. STANDARD SAFETY PROTOCOLS ENGAGED."
    };
    setMessages(prev => [...prev, sysMsg]);
  };
  
  const handleProtocolTrigger = (protocol: Protocol, trigger: string) => {
    setCurrentProtocol(protocol);
    setIsLoading(true);
    
    setTimeout(async () => {
      setIsLoading(false);
      const response = await getJarvisResponse(trigger);
      if (protocol === Protocol.CLEAN_SLATE) {
        setMessages([]); // Clear messages for CLEAN SLATE protocol
        startJarvisSession(); // Restart JARVIS text session
      }
      const protocolMessage: Message = { id: (Date.now() + 1).toString(), sender: MessageSender.JARVIS, text: response.text, action: response.action ?? undefined, systemInfo: response.systemInfo ?? undefined };
      setMessages(prev => [...prev, protocolMessage]);
      if (protocol === Protocol.CLEAN_SLATE) setCurrentProtocol(Protocol.NORMAL); // Reset protocol after clean slate
    }, 1000);
  };

  const handleJarvisLiveError = useCallback((error: string) => {
    const errorMessage: Message = { 
        id: Date.now().toString(), 
        sender: MessageSender.JARVIS, 
        text: '', 
        systemInfo: { systemFailure: `VOICE ERROR: ${error}` } 
    };
    setMessages(prev => [...prev, errorMessage]);
    // Also stop the voice session if an error occurs to prevent continuous error states
    liveSessionManagerRef.current?.stop();
  }, []);

  const handleToggleVoice = useCallback(() => {
    // If voice is currently OFF, IDLE, or in ERROR, try to start it.
    if (voiceStatus === 'OFF' || voiceStatus === 'IDLE' || voiceStatus === 'ERROR') {
      // If no manager exists, or if it was previously stopped due to an error, create a new one.
      // This ensures we always get a fresh session and can re-attempt API key selection if needed.
      if (!liveSessionManagerRef.current || voiceStatus === 'ERROR') {
          liveSessionManagerRef.current = null; // Clear old reference to ensure new instance
          const callbacks: LiveSessionCallbacks = {
              onStatusChange: setVoiceStatus,
              onUserTranscript: setUserTranscript,
              onJarvisTranscript: setJarvisTranscript,
              onNewMessage: (newMessage) => setMessages(prev => [...prev, newMessage]),
              onError: handleJarvisLiveError, // Use the new error handler
          };
          liveSessionManagerRef.current = new LiveSessionManager(callbacks);
      }
      liveSessionManagerRef.current?.start();
    } else {
      // If voice is active (CONNECTING, LISTENING, SPEAKING), stop it.
      liveSessionManagerRef.current?.stop();
    }
  }, [voiceStatus, handleJarvisLiveError]);
  
  // Cleanup for LiveSessionManager on component unmount
  useEffect(() => {
    return () => {
      if (liveSessionManagerRef.current) {
        liveSessionManagerRef.current.stop();
        liveSessionManagerRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount


  // Effect to handle system action execution (from text mode)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // Check if the message is from JARVIS and contains an action
    if (lastMessage && lastMessage.sender === MessageSender.JARVIS && lastMessage.action) {
      const { action } = lastMessage;
      
      // Map of known applications to their URLs or protocol handlers
      const APP_URL_MAP: { [key: string]: string } = {
        'youtube': 'https://www.youtube.com',
        'spotify': 'https://open.spotify.com',
        'google': 'https://www.google.com',
        'gmail': 'https://mail.google.com',
        'github': 'https://github.com',
        'reddit': 'https://www.reddit.com',
        'twitter': 'https://twitter.com',
        'amazon': 'https://www.amazon.com',
        'wikipedia': 'https://www.wikipedia.org',
        'whatsapp': 'https://web.whatsapp.com',
        'vscode': 'vscode://file',
      };

      setTimeout(() => {
        let confirmationText = '';
        const targetKey = action.target.toLowerCase().trim().replace(/ /g, '_');

        if (action.functionType === 'APP_LAUNCH' || action.functionType === 'PLAY_MEDIA') {
            const urlToOpen = APP_URL_MAP[targetKey];
            if (urlToOpen) {
                try {
                    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                    confirmationText = `Opening ${action.target} in a new tab... Command dispatched.`;
                } catch(e) {
                    console.error("Failed to open URL:", e);
                    confirmationText = `Could not open ${action.target}. Your browser may be blocking pop-ups.`;
                }
            } else {
                 confirmationText = `Executing launch protocol for ${action.target}... (Simulated for non-web targets).`;
            }
        } else if (action.functionType === 'HOME_CTRL') {
            confirmationText = `Adjusting ${action.target}. State set to: ${action.state}.`;
        } else {
            confirmationText = `System command [${action.functionType}] on [${action.target}] dispatched successfully.`;
        }

        const systemMessage: Message = {
          id: `action-${Date.now()}`,
          sender: MessageSender.SYSTEM_ACTION,
          text: confirmationText,
        };
        setMessages(prev => [...prev, systemMessage]);
      }, 750); // Simulate execution delay
    }
  }, [messages]);

  const protocolStyles = {
    [Protocol.NORMAL]: { border: 'border-cyan-500/30', text: 'text-cyan-300', shadow: 'shadow-cyan-500/10' },
    [Protocol.VERONICA]: { border: 'border-red-500/50', text: 'text-red-300', shadow: 'shadow-red-500/20' },
    [Protocol.HOUSE_PARTY]: { border: 'border-yellow-500/50', text: 'text-yellow-300', shadow: 'shadow-yellow-500/20' },
    [Protocol.CLEAN_SLATE]: { border: 'border-cyan-500/30', text: 'text-cyan-300', shadow: 'shadow-cyan-500/10' },
    [Protocol.SILENT_NIGHT]: { border: 'border-gray-600/50', text: 'text-gray-400', shadow: 'shadow-gray-500/10' },
  };

  const currentStyle = protocolStyles[currentProtocol];
  
  const customStyles = `
    :root { font-family: 'Orbitron', sans-serif; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInFromRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes fadeInPulse { 0% { opacity: 0; transform: scale(0.95); } 80% { opacity: 1; transform: scale(1.02); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes pulse-glow { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
    @keyframes rotate { from { transform: rotate3d(0, 0, 0, 0); } to { transform: rotate3d(1, 1, 0.5, 360deg); } }
    @keyframes holographic-rotate {
      0%   { transform: rotate3d(1, 1, 0, 0deg)   scale(1);    opacity: 0.9; }
      20%  { transform: rotate3d(0.5, 1, 1, 90deg)  scale(1.02); opacity: 1; }
      40%  { transform: rotate3d(1, 0.5, 0, 180deg) scale(0.98); opacity: 0.95; }
      60%  { transform: rotate3d(1, 1, 0.5, 270deg) scale(1.01); opacity: 1; }
      80%  { transform: rotate3d(0, 0.5, 1, 320deg) scale(0.99); opacity: 0.85; }
      100% { transform: rotate3d(1, 1, 0, 360deg) scale(1);    opacity: 0.9; }
    }
    @keyframes holographic-flicker {
      0%, 100% { opacity: 1; box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) inset; }
      20% { opacity: 0.95; }
      22% { opacity: 1; }
      40% { opacity: 0.8; box-shadow: 0 0 25px rgba(0, 255, 255, 0.6) inset; }
      41% { opacity: 1; }
      65% { opacity: 0.9; }
      68% { opacity: 1; }
      82% { opacity: 0.85; box-shadow: 0 0 18px rgba(0, 255, 255, 0.4) inset; }
      84% { opacity: 1; }
    }
    @keyframes animate-grid {
      0% { background-position: 0 0; opacity: 0.5; }
      50% { opacity: 0.7; }
      100% { background-position: -2rem -2rem; opacity: 0.5; }
    }
    @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
    @keyframes waveform-pulse { 0%, 100% { transform: scaleY(0.5); opacity: 0.5; } 50% { transform: scaleY(1); opacity: 1; } }
    @keyframes live-waveform { 0% { transform: scaleY(0.2); } 25% { transform: scaleY(1.0); } 50% { transform: scaleY(0.4); } 75% { transform: scaleY(0.8); } 100% { transform: scaleY(0.2); } }
    
    .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
    .animate-fadeInFromRight { animation: fadeInFromRight 0.5s ease-out forwards; }
    .animate-fadeInPulse { animation: fadeInPulse 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }
    .animate-scanline { animation: scanline 1.5s linear infinite; }
    .animate-pulse-glow { animation: pulse-glow 2s infinite ease-in-out; }
    .animate-grid { animation: animate-grid 8s linear infinite; }

    .bg-grid-pattern {
      background-image: linear-gradient(to right, rgba(0, 119, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 119, 255, 0.1) 1px, transparent 1px);
      background-size: 2rem 2rem;
    }
    
    .ai-core { position: relative; width: 300px; height: 300px; }
    .ai-core-ring { position: absolute; inset: 10%; border-radius: 50%; border: 2px solid transparent; border-top-color: #0ff; animation: rotate 2s linear infinite; }
    .ai-core-ring:nth-child(2) { animation-duration: 3s; animation-direction: reverse; border-top-color: #07f; }
    .ai-core-ring:nth-child(3) { animation-duration: 4s; inset: 20%; border-top-color: #f0f; }
    
    .prose { --tw-prose-body: currentColor; --tw-prose-bold: currentColor; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.3); border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,255,255,0.5); }
  `;

  if (isBooting) return <BootSequence onComplete={handleBootComplete} />;

  return (
    <>
      <style>{customStyles}</style>
      <div className={`h-screen w-screen flex flex-col bg-transparent text-white transition-all duration-500 overflow-hidden ${currentProtocol === Protocol.SILENT_NIGHT ? 'brightness-75' : ''}`}>
        <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
            <div className="ai-core"><div className="ai-core-ring"></div><div className="ai-core-ring"></div><div className="ai-core-ring"></div></div>
        </div>

        <div className="relative flex-1 flex justify-center items-center p-4 gap-4">
            <aside className="w-48 h-full hidden lg:flex flex-col space-y-4">
              <SystemStatusPanel />
              {/* HolographicDisplayPanel removed from sidebar, now central */}
            </aside>
            <main className={`h-full w-full max-w-5xl flex flex-col border bg-black/40 shadow-2xl transition-all duration-500 ${currentStyle.border} ${currentStyle.shadow}`}>
                <header className={`relative text-center p-2 border-b flex justify-center items-center bg-black/50 ${currentStyle.border} ${currentStyle.text}`}>
                    <h1 className="text-lg font-bold tracking-[0.5em] text-cyan-400/80">JARVIS // EXECUTIVE_CORE</h1>
                </header>
                
                {/* --- TOP SECTION: VISUALIZATION & VOICE --- */}
                <HolographicCore 
                  voiceStatus={voiceStatus}
                  jarvisTranscript={jarvisTranscript}
                  userTranscript={userTranscript}
                />

                {/* --- BOTTOM SECTION: TEXT CHAT & COMMS --- */}
                <ChatWindow messages={messages} isLoading={isLoading} protocol={currentProtocol} />
                <InputBar
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  protocol={currentProtocol}
                  voiceStatus={voiceStatus}
                  onToggleVoice={handleToggleVoice}
                  userTranscript={userTranscript}
                  jarvisTranscript={jarvisTranscript}
                />
            </main>
            <aside className="w-48 h-full hidden lg:flex flex-col space-y-4">
              <ResourceMetersPanel />
              <StockTickerPanel />
              <WorldClockPanel />
            </aside>
        </div>

        {/* Debug / Developer Panel Overlay */}
        {showDebug && (
            <DebugPanel 
                onClose={() => setShowDebug(false)} 
                onToggleGodMode={handleToggleGodMode} 
                godModeEnabled={godMode}
            />
        )}
        
        {/* Invisible trigger for mouse users (Bottom Right Corner) */}
        <div 
            className="fixed bottom-0 right-0 w-10 h-10 z-40 cursor-cell" 
            title="Developer Override"
            onDoubleClick={() => setShowDebug(prev => !prev)}
        ></div>
      </div>
    </>
  );
};

export default App;
