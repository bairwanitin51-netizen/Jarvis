
import React from 'react';
import { Message, MessageSender, Protocol, SystemInfo, Source, RenderModel, Simulation, Widget, FileOperation } from '../types';
import { marked } from 'marked';

interface MessageProps {
  message: Message;
  protocol: Protocol;
}

const SystemInfoDisplay: React.FC<{ systemInfo: SystemInfo | undefined }> = ({ systemInfo }) => {
  if (!systemInfo) return null;
  
  return (
    <div className="mb-2 text-xs font-mono opacity-80 space-y-2">
      {systemInfo.systemFailure && (
        <p className="text-red-400 bg-red-900/30 p-2 border-l-2 border-red-500">
          <span className="font-bold tracking-wider">[FAILURE]</span> {systemInfo.systemFailure}
        </p>
      )}
    </div>
  );
};

const ModeIndicator: React.FC<{ mode: string }> = ({ mode }) => (
  <div className="absolute top-0 right-0 -mt-3 mr-2 bg-cyan-900/90 border border-cyan-500/50 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full shadow-lg tracking-widest font-mono animate-fadeIn transform translate-y-1/2 z-20">
    {mode.toUpperCase()}
  </div>
);

const VisualWidgetDisplay: React.FC<{ widgetName: string }> = ({ widgetName }) => (
  <div className="my-2 text-center animate-fadeIn">
      <span className="inline-block border border-dashed border-cyan-500/30 px-3 py-1 text-[10px] text-cyan-400 font-mono tracking-[0.2em]">
        HOLO_EMITTER: {widgetName.toUpperCase()}
      </span>
  </div>
);

const RenderModelDisplay: React.FC<{ model: RenderModel }> = ({ model }) => (
  <div className="my-4 p-1 bg-black/40 border border-cyan-500/40 rounded overflow-hidden relative animate-fadeIn">
    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
    <div className="p-4 flex flex-col space-y-2 font-mono text-xs relative z-10">
      <div className="flex justify-between items-center border-b border-cyan-500/20 pb-2">
         <span className="text-cyan-400 font-bold tracking-widest">RENDER_PREVIEW</span>
         <span className="text-cyan-600 animate-pulse">PROCESSING...</span>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2 text-cyan-300/80">
         <div>
            <span className="text-cyan-600 block text-[10px]">VIEWPORT</span>
            {model.viewport}
         </div>
         <div>
            <span className="text-cyan-600 block text-[10px]">ANGLE</span>
            {model.angle}
         </div>
         <div className="col-span-2">
            <span className="text-cyan-600 block text-[10px]">STYLE</span>
            {model.style}
         </div>
      </div>
      <div className="h-32 w-full border border-dashed border-cyan-500/30 mt-2 flex items-center justify-center bg-black/50">
          <div className="text-cyan-500/30 font-bold text-2xl tracking-widest animate-pulse">VISUALIZING</div>
      </div>
    </div>
  </div>
);

const SimulationDisplay: React.FC<{ simulation: Simulation }> = ({ simulation }) => (
  <div className="my-4 font-mono text-xs bg-black/30 border border-green-500/30 rounded p-3 animate-fadeIn">
    <div className="flex items-center justify-between mb-2 text-green-400 border-b border-green-500/20 pb-1">
        <span className="tracking-widest font-bold">SIMULATION_RUNNING</span>
        <span className="animate-pulse">●</span>
    </div>
    <div className="space-y-1 text-green-300/80">
        <div className="flex justify-between">
            <span>VARIABLE:</span> <span className="text-white">{simulation.variable}</span>
        </div>
        <div className="flex justify-between">
            <span>DURATION:</span> <span className="text-white">{simulation.duration}</span>
        </div>
        <div className="flex justify-between">
            <span>NICHE_VECTOR:</span> <span className="text-white">{simulation.niche}</span>
        </div>
    </div>
    <div className="mt-3 h-1.5 bg-green-900/40 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 animate-[scanline_2s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
    </div>
  </div>
);

const WidgetDisplay: React.FC<{ widget: Widget }> = ({ widget }) => {
  const colorClass = widget.color.toLowerCase() === 'green' ? 'text-green-400 border-green-500/40' : 'text-cyan-400 border-cyan-500/40';
  const bgClass = widget.color.toLowerCase() === 'green' ? 'bg-green-900/10' : 'bg-cyan-900/10';
  const barColor = widget.color.toLowerCase() === 'green' ? 'bg-green-500' : 'bg-cyan-500';

  return (
    <div className={`my-4 border ${colorClass} ${bgClass} rounded p-4 font-mono text-xs animate-fadeIn relative overflow-hidden`}>
       <div className="absolute top-0 right-0 p-2 opacity-20 text-4xl">
           {widget.type === 'Exponential' ? '📈' : '📊'}
       </div>
       <h3 className="font-bold tracking-widest mb-1 border-b border-dashed border-current pb-1 w-fit">{widget.title.toUpperCase()}</h3>
       <p className="opacity-70 mb-4">TYPE: {widget.type.toUpperCase()}</p>
       
       <div className="flex items-end justify-between h-24 gap-2 px-2 border-b border-l border-current/30">
           {[20, 35, 40, 55, 60, 85, 95].map((h, i) => (
               <div key={i} className={`w-full ${barColor} opacity-60 hover:opacity-100 transition-opacity`} style={{ height: `${h}%` }}></div>
           ))}
       </div>
       <div className="flex justify-between mt-1 opacity-50 text-[9px]">
           <span>START</span>
           <span>PROJECTION</span>
       </div>
    </div>
  );
};

const FileOperationDisplay: React.FC<{ fileOperation: FileOperation }> = ({ fileOperation }) => (
  <div className="my-4 p-3 border border-blue-500/40 bg-blue-900/20 rounded font-mono text-xs animate-fadeIn relative overflow-hidden">
    <div className="flex items-center justify-between mb-2 text-blue-300">
        <span className="font-bold tracking-widest">EXECUTIVE_OPS</span>
        <span className="text-[10px] opacity-70">{fileOperation.status}</span>
    </div>
    <div className="flex items-center gap-3">
        <div className="w-8 h-10 border border-blue-400/50 bg-blue-500/10 flex items-center justify-center relative">
             <div className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-blue-400/50"></div>
             <span className="text-xl">📄</span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="truncate text-blue-100 font-bold">{fileOperation.filename}</p>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-blue-400 animate-pulse">SYNTHESIZING DOCUMENT...</span>
            </div>
        </div>
    </div>
    <div className="mt-3 h-1 w-full bg-blue-900/50 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 animate-[scanline_1.5s_ease-in-out_infinite] w-1/2"></div>
    </div>
  </div>
);

const SystemActionDisplay: React.FC<{ action: Message['action'] }> = ({ action }) => {
  if (!action) return null;

  const isUpload = action.functionType === 'UPLOAD_FILE';
  const isDbAccess = action.functionType === 'ACCESS_DB';
  
  let borderColor = 'border-orange-500/30';
  let bgColor = 'bg-black/80';
  let titleColor = 'text-orange-400';
  let textColor = 'text-orange-200/90';
  let accentColor = 'text-orange-500';
  let title = '>_ SYSTEM_EXEC';

  if (isUpload) {
      borderColor = 'border-blue-500/30';
      titleColor = 'text-blue-400';
      textColor = 'text-blue-200/90';
      accentColor = 'text-blue-500';
      title = '>_ UPLINK_ESTABLISHED';
  } else if (isDbAccess) {
      borderColor = 'border-green-500/30';
      titleColor = 'text-green-400';
      textColor = 'text-green-200/90';
      accentColor = 'text-green-500';
      title = '>_ ROOT_ACCESS';
  }

  return (
    <div className={`mt-2 mb-2 p-2 border-l-2 ${borderColor} ${bgColor} font-mono text-xs animate-fadeIn`}>
      <div className="flex justify-between items-center mb-1">
          <p className={`${titleColor} font-bold tracking-widest`}>{title}</p>
          <span className="text-[10px] opacity-50">{new Date().toLocaleTimeString()}</span>
      </div>
      <div className="pl-2 space-y-0.5">
         <div className="flex gap-2">
            <span className={`${accentColor} opacity-70`}>CMD:</span>
            <span className={textColor}>{action.functionType}</span>
         </div>
         <div className="flex gap-2">
             <span className={`${accentColor} opacity-70`}>TGT:</span>
             <span className={textColor}>{action.target}</span>
         </div>
         {action.state && action.state !== 'N/A' && (
             <div className="flex gap-2">
                <span className={`${accentColor} opacity-70`}>STS:</span>
                <span className={textColor}>{action.state}</span>
             </div>
         )}
      </div>
    </div>
  );
};

const GroundingSourcesDisplay: React.FC<{ sources: Source[] | undefined }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-cyan-500/20 font-mono text-xs animate-fadeIn">
      <p className="text-cyan-300 tracking-widest mb-2">[SOURCES REFERENCED]</p>
      <ul className="space-y-1 list-none pl-2">
        {sources.map((source, index) => (
          <li key={index}>
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400/80 hover:text-cyan-200 hover:underline transition-colors break-all"
              title={source.uri}
            >
              {`[${index + 1}] ${source.title}`}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Specialized renderer for Audio Debug logs
const AudioDebugLog: React.FC<{ text: string }> = ({ text }) => {
    if (text.includes('AUDIO_DEBUG_LOG')) {
        return <div className="my-1 font-mono text-[10px] text-cyan-500/80 border-l-2 border-cyan-600 pl-2">{text.replace('[', '').replace(']', '')}</div>;
    }
    if (text.includes('ERROR_DETECTED')) {
        return <div className="my-1 font-mono text-[10px] text-red-400 border-l-2 border-red-600 pl-2">{text.replace('[', '').replace(']', '')}</div>;
    }
    if (text.includes('AUDIO_FILTER')) {
        return <div className="my-1 font-mono text-[10px] text-purple-400 border-l-2 border-purple-600 pl-2">{text.replace('[', '').replace(']', '')}</div>;
    }
    return null;
};

export const ChatMessage: React.FC<MessageProps> = ({ message, protocol }) => {
  const isJarvis = message.sender === MessageSender.JARVIS || message.sender === MessageSender.SYSTEM_INFO;
  const isUser = message.sender === MessageSender.USER;
  
  if (message.sender === MessageSender.SYSTEM_ACTION) {
    // Terminal-style autonomous action log
    return (
      <div className="my-2 px-4 font-mono text-xs text-green-400/80 animate-fadeIn w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-2 opacity-80">
            <span className="text-green-600">➜</span>
            <span className="font-bold">EXEC:</span>
            <span>{message.text}</span>
        </div>
      </div>
    );
  }

  const animationClass = isUser ? 'animate-fadeInFromRight' : 'animate-fadeInPulse';
  const containerClasses = `flex mb-6 ${animationClass} ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `max-w-xl lg:max-w-2xl px-5 py-3 shadow-lg relative backdrop-blur-sm`;
  
  const protocolStyles = {
    [Protocol.NORMAL]: { jarvis: 'border-cyan-400', user: 'border-blue-400' },
    [Protocol.VERONICA]: { jarvis: 'border-red-500', user: 'border-red-500' },
    [Protocol.HOUSE_PARTY]: { jarvis: 'border-yellow-400', user: 'border-yellow-400' },
    [Protocol.CLEAN_SLATE]: { jarvis: 'border-cyan-400', user: 'border-blue-400' },
    [Protocol.SILENT_NIGHT]: { jarvis: 'border-gray-500', user: 'border-gray-500' },
  }

  const jarvisBubbleClasses = `
    bg-cyan-900/20 border-l-4 text-cyan-50
  `;
  const userBubbleClasses = `
    bg-blue-900/30 border-r-4 text-white
  `;

  // Check if text contains special Veo tags and separate them
  let textContent: React.ReactNode = null;
  let debugLogs: string[] = [];

  if (typeof message.text === 'string' && message.text.trim() !== '') {
      // Filter out debug logs from main text body to render them separately
      const lines = message.text.split('\n');
      const cleanLines: string[] = [];
      
      lines.forEach(line => {
          if (line.includes('AUDIO_DEBUG_LOG') || line.includes('ERROR_DETECTED') || line.includes('AUDIO_FILTER')) {
              debugLogs.push(line);
          } else if (!line.includes('VEO_ACTION')) {
              cleanLines.push(line);
          }
      });

      const cleanedText = cleanLines.join('\n');
      const parsedHtml = marked.parse(cleanedText);
      
      textContent = isJarvis 
        ? <div className="prose prose-invert prose-p:my-2 prose-p:text-cyan-100" dangerouslySetInnerHTML={{ __html: parsedHtml as string }} /> 
        : <p>{message.text}</p>;
  }

  return (
    <div className={containerClasses}>
      <div 
        className={`${bubbleClasses} ${isUser ? userBubbleClasses : jarvisBubbleClasses}`}
        style={{ borderColor: isUser ? protocolStyles[protocol].user : protocolStyles[protocol].jarvis }}
      >
        {isJarvis && message.mode && <ModeIndicator mode={message.mode} />}
        {isJarvis && <SystemInfoDisplay systemInfo={message.systemInfo} />}
        
        {/* Render Video if present */}
        {message.videoUrl && (
           <div className="mb-3 rounded overflow-hidden border border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)] relative group">
                <div className="absolute top-2 right-2 bg-black/60 text-cyan-400 text-[10px] font-mono px-2 py-1 rounded border border-cyan-500/30">
                    VEO 3.1 | 4K SIMULATION
                </div>
                <video 
                    src={message.videoUrl} 
                    controls 
                    className="w-full h-auto object-cover"
                    autoPlay
                    muted={false}
                />
           </div>
        )}

        {/* Render Image if present */}
        {message.imageUrl && (
          <div className="mb-3 rounded overflow-hidden border border-cyan-500/30 shadow-lg">
            <img src={message.imageUrl} alt="Content" className="max-w-full h-auto" />
          </div>
        )}

        {message.sender === MessageSender.JARVIS && message.visualContext && <VisualWidgetDisplay widgetName={message.visualContext} />}

        {message.text.trim() && textContent}

        {/* Render Audio Debug Logs nicely */}
        {debugLogs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-cyan-900/50 bg-black/20 p-2 rounded">
                {debugLogs.map((log, i) => <AudioDebugLog key={i} text={log} />)}
            </div>
        )}
        
        {message.sender === MessageSender.JARVIS && message.renderModel && <RenderModelDisplay model={message.renderModel} />}
        {message.sender === MessageSender.JARVIS && message.simulation && <SimulationDisplay simulation={message.simulation} />}
        {message.sender === MessageSender.JARVIS && message.widget && <WidgetDisplay widget={message.widget} />}
        {message.sender === MessageSender.JARVIS && message.fileOperation && <FileOperationDisplay fileOperation={message.fileOperation} />}
        {message.sender === MessageSender.JARVIS && <SystemActionDisplay action={message.action} />}
        {message.sender === MessageSender.JARVIS && <GroundingSourcesDisplay sources={message.sources} />}
      </div>
    </div>
  );
};
