import React, { useState, useEffect } from 'react';
import { BOOT_SEQUENCE_MESSAGES } from '../constants';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < BOOT_SEQUENCE_MESSAGES.length) {
      const timeout = setTimeout(() => {
        setMessages(prev => [...prev, BOOT_SEQUENCE_MESSAGES[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 400 + Math.random() * 200);
      return () => clearTimeout(timeout);
    } else {
      const finalTimeout = setTimeout(onComplete, 1000);
      return () => clearTimeout(finalTimeout);
    }
  }, [currentIndex, onComplete]);

  return (
    <div className="flex items-center justify-center h-screen font-mono text-cyan-400 bg-black">
       <div className="p-8 w-full max-w-2xl text-center">
        <div className="text-lg space-y-2">
          {messages.map((msg, index) => (
            <p 
              key={index} 
              className="animate-fadeIn" 
              style={{ textShadow: '0 0 8px #00ffff' }}
            >
              {`> ${msg}`}
            </p>
          ))}
          {currentIndex < BOOT_SEQUENCE_MESSAGES.length && <div className="inline-block w-3 h-5 bg-cyan-400 animate-pulse ml-2" />}
        </div>
      </div>
    </div>
  );
};