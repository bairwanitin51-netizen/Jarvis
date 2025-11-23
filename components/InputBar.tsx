
import React, { useState, useRef } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { MicIcon } from './icons/MicIcon';
import { GeminiSparkleIcon } from './icons/GeminiSparkleIcon';
import { SettingsSlidersIcon } from './icons/SettingsSlidersIcon';
import { SendIcon } from './icons/SendIcon';
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
  onToggleVoice,
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

  return (
    <div className="p-4 pb-8 w-full flex justify-center z-40 relative">
      {/* Floating Input Container */}
      <div className="w-full max-w-[800px] flex flex-col items-center gap-4">
          
          {/* Attachment Preview (Floating above input) */}
          {attachment && (
            <div className="relative group animate-fadeIn">
                <img src={attachment.previewUrl} alt="Attachment" className="h-24 w-auto rounded-xl border border-gray-700 object-cover shadow-lg" />
                <button 
                    onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 border border-gray-600"
                >
                    ×
                </button>
            </div>
          )}

          {/* The Main Pill Bar */}
          <div className="w-full bg-[#1e1f20] rounded-full flex items-center p-2 pl-3 shadow-2xl border border-gray-800/50 focus-within:border-gray-600 transition-all duration-300">
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />
            
            {/* LEFT CONTROLS */}
            <div className="flex items-center gap-2 pr-2">
                {/* Plus Icon */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-full transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
                
                {/* Settings Icon */}
                {/* Hidden on very small screens if needed, but requested in prompt */}
                <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-full transition-colors"
                >
                    <SettingsSlidersIcon className="w-5 h-5" />
                </button>
            </div>

            {/* INPUT FIELD */}
            <form onSubmit={handleSubmit} className="flex-1">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachment ? "Add a caption..." : "Ask J.A.R.V.I.S."}
                disabled={isLoading}
                className="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-[16px] px-2 font-sans"
                />
            </form>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center gap-1 pl-2">
                 {/* Thinking Chip */}
                 {isLoading && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full animate-fadeIn mr-1">
                         <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                         <span className="text-xs text-gray-300 font-medium">Thinking</span>
                    </div>
                 )}

                 {/* Send Button (Visible when typing) OR Mic/Sparkle (Visible when empty) */}
                 {input.trim() || attachment ? (
                     <button 
                        onClick={handleSubmit}
                        className="p-2 bg-cyan-600 rounded-full text-white shadow-lg hover:bg-cyan-500 transition-all animate-fadeIn mx-1"
                     >
                         <SendIcon className="w-5 h-5" />
                     </button>
                 ) : (
                     <>
                        {/* Mic Icon */}
                        <button
                            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <MicIcon className="w-6 h-6" />
                        </button>

                        {/* Gemini Sparkle - The Live Trigger */}
                        <button
                            onClick={onToggleVoice}
                            className="p-2 rounded-full transition-all duration-300 hover:bg-gray-700/50 group relative"
                            title="Start Live Session"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-30 blur-md transition-opacity"></div>
                            <GeminiSparkleIcon className="w-8 h-8 relative z-10" />
                        </button>
                     </>
                 )}
            </div>
         </div>
      </div>
    </div>
  );
};
