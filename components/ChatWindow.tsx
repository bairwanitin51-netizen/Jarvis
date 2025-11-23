
import React, { useRef, useEffect } from 'react';
import type { Message, Protocol, UiAction } from '../types';
import { ChatMessage } from './Message';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  protocol: Protocol;
  uiAction?: UiAction;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, protocol, uiAction }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLockedRef = useRef(false);

  useEffect(() => {
      if (!uiAction) {
          // Default behavior: Scroll to bottom unless locked
          if (!isLockedRef.current) {
              endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
          return;
      }

      const container = containerRef.current;
      if (!container) return;

      switch (uiAction.type) {
          case 'SCROLL_UP':
               container.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' });
               break;
          case 'SCROLL_DOWN':
               container.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
               break;
          case 'SCROLL_TO_TOP':
               container.scrollTo({ top: 0, behavior: 'smooth' });
               break;
          case 'SCROLL_TO_BOTTOM':
               endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
               break;
          case 'LOCK':
               isLockedRef.current = true;
               break;
          case 'UNLOCK':
               isLockedRef.current = false;
               endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
               break;
          default:
               // Default auto-scroll behavior if not locked
               if (!isLockedRef.current) {
                 endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
               }
      }
  }, [messages, isLoading, uiAction]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar scroll-smooth">
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
