


import React from 'react';
import { Message, MessageSender, Protocol, SystemInfo, Source } from '../types';
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


const SystemActionDisplay: React.FC<{ action: Message['action'] }> = ({ action }) => {
  if (!action) return null;

  return (
    <div className="mt-3 p-3 border border-orange-500/50 bg-orange-900/40 font-mono text-sm animate-fadeIn">
      <p className="text-orange-400 font-bold tracking-widest">[SYSTEM ACTION]</p>
      <div className="pl-4 border-l-2 border-orange-600 ml-2 mt-2 text-orange-200/90 grid grid-cols-[auto_1fr] gap-x-2">
        <span className="text-orange-400">Function:</span> <span>{action.functionType}</span>
        <span className="text-orange-400">Target:</span>   <span>{action.target}</span>
        <span className="text-orange-400">State:</span>    <span>{action.state}</span>
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

export const ChatMessage: React.FC<MessageProps> = ({ message, protocol }) => {
  const isJarvis = message.sender === MessageSender.JARVIS || message.sender === MessageSender.SYSTEM_INFO;
  const isUser = message.sender === MessageSender.USER;
  
  if (message.sender === MessageSender.SYSTEM_ACTION) {
    return (
      <div className="my-3 text-center font-mono text-xs text-green-400/90 animate-fadeIn">
        <p className="inline-block bg-green-900/30 px-3 py-1 border border-green-500/40 rounded-full shadow-md">
          <span className="font-bold">[BUS]</span> {message.text}
        </p>
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

  // Ensure message.text is a string before parsing
  const parsedHtml = (typeof message.text === 'string' && message.text.trim() !== '') 
    ? marked.parse(message.text) 
    : '';

  const textContent = isJarvis 
    ? <div className="prose prose-invert prose-p:my-2 prose-p:text-cyan-100" dangerouslySetInnerHTML={{ __html: parsedHtml }} /> 
    : <p>{message.text}</p>;

  return (
    <div className={containerClasses}>
      <div 
        className={`${bubbleClasses} ${isUser ? userBubbleClasses : jarvisBubbleClasses}`}
        style={{ borderColor: isUser ? protocolStyles[protocol].user : protocolStyles[protocol].jarvis }}
      >
        {isJarvis && <SystemInfoDisplay systemInfo={message.systemInfo} />}
        {message.text.trim() && textContent}
        {message.sender === MessageSender.JARVIS && <SystemActionDisplay action={message.action} />}
        {message.sender === MessageSender.JARVIS && <GroundingSourcesDisplay sources={message.sources} />}
      </div>
    </div>
  );
};