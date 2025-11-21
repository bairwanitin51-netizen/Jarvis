import React, { useRef, useEffect } from 'react';
import type { Message, Protocol } from '../types';
import { ChatMessage } from './Message';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  protocol: Protocol;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, protocol }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      {messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} protocol={protocol} />
      ))}
      {isLoading && (
        <div className="flex justify-start mb-6 animate-fadeIn">
            <div className="max-w-xs px-5 py-4 bg-cyan-900/20 border-l-4 border-cyan-400">
                <div className="w-20 h-1 bg-cyan-900/50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-4 bg-cyan-400 animate-scanline"></div>
                </div>
            </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};