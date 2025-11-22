
import React, { useState, useRef } from 'react';
import { SendIcon } from './icons/SendIcon';
import { MicIcon } from './icons/MicIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { Protocol } from '../types';
import type { VoiceStatus } from '../services/jarvisService';

interface InputBarProps {
  onSendMessage: (message: string, attachment?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
  protocol: Protocol;
  voiceStatus: VoiceStatus;
  onToggleVoice: () => void;
  userTranscript: string;
  jarvisTranscript: string;
}

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
  const [attachment, setAttachment] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix for API usage
        const base64Data = base64String.split(',')[1];
        setAttachment({
          data: base64Data,
          mimeType: file.type,
          previewUrl: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachment) && !isLoading) {
      const attachmentData = attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined;
      onSendMessage(input.trim(), attachmentData);
      setInput('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div className={`p-4 border-t ${currentBorderStyle} transition-all duration-300 relative bg-black/20 backdrop-blur-sm`}>
       {attachment && (
        <div className="absolute bottom-full left-4 mb-2 p-2 bg-black/80 border border-cyan-500/30 rounded-md animate-fadeIn">
            <div className="relative group">
                <img src={attachment.previewUrl} alt="Attachment" className="h-20 w-auto rounded object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <button 
                    onClick={handleRemoveAttachment}
                    className="absolute -top-2 -right-2 bg-red-900/80 text-red-200 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                    ×
                </button>
            </div>
        </div>
      )}

      <div className="flex items-center space-x-4 relative">
        <div className={`absolute -left-px -top-px w-3 h-3 border-l-2 border-t-2 ${currentBorderStyle}`}></div>
        <div className={`absolute -right-px -top-px w-3 h-3 border-r-2 border-t-2 ${currentBorderStyle}`}></div>
        <div className={`absolute -left-px -bottom-px w-3 h-3 border-l-2 border-b-2 ${currentBorderStyle}`}></div>
        <div className={`absolute -right-px -bottom-px w-3 h-3 border-r-2 border-b-2 ${currentBorderStyle}`}></div>
        
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
        />
        
        <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isVoiceActive}
            className={`p-3 rounded-full transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles[protocol]}`}
            title="Attach Image"
        >
            <PaperClipIcon className="w-6 h-6" />
        </button>

        <div className="relative w-full h-[52px]">
           <form onSubmit={handleSubmit} className="w-full h-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={attachment ? "Enter prompt to edit this image..." : "Awaiting input, Sir..."}
              disabled={isLoading || isVoiceActive}
              className={`w-full h-full p-3 bg-transparent placeholder-gray-500 focus:outline-none transition-opacity duration-300 ${currentTextColor} ${isVoiceActive ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
              style={{ textShadow: '0 0 5px currentColor' }}
            />
          </form>
        </div>
        
        <button
          type="button"
          onClick={onToggleVoice}
          disabled={isLoading && !isVoiceActive}
          className={`p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            isVoiceActive 
            ? 'bg-red-600/70 hover:bg-red-500/90 text-red-100 animate-pulse-glow shadow-[0_0_15px_red]' 
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
