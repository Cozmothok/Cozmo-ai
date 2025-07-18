

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, MicrophoneIcon, PaperclipIcon, XCircleIcon } from './icons';

// Define SpeechRecognition types for cross-browser compatibility
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface MessageInputProps {
  onSendMessage: (message: string, image?: { file: File, previewUrl: string }) => void;
  isLoading: boolean;
  onVoiceInputStart: () => void; // New prop for voice input start
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, onVoiceInputStart }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ file: File, previewUrl: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const justSpokeRef = useRef(false);

  const handleSend = useCallback(() => {
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input.trim(), image || undefined);
      setInput('');
      setImage(null);
      if (image?.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
      }
    }
  }, [input, image, isLoading, onSendMessage]);
  
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        justSpokeRef.current = false;
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Use timeout to ensure `onresult` has updated state before sending
        setTimeout(() => {
            if (justSpokeRef.current) {
                handleSendRef.current();
                justSpokeRef.current = false;
            }
        }, 100);
      };

      recognitionRef.current.onerror = (event: any) => {
        // The 'aborted' error is a common, non-critical status report from the browser's
        // speech engine, often triggered by manually stopping the microphone.
        // We will handle it gracefully to prevent it from appearing as a system error.
        if (event.error === 'aborted') {
            setIsListening(false); // Ensure state is correctly reset.
            return; // Suppress the non-critical error from the console.
        }
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
        justSpokeRef.current = true;
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handleSendRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setImage({ file, previewUrl });
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Sorry, your browser doesn't support speech recognition.");
        return;
    }
    if (isListening) {
      justSpokeRef.current = false;
      recognitionRef.current.stop();
    } else {
      onVoiceInputStart(); // Call the new prop
      setInput('');
      recognitionRef.current.start();
    }
  };

  return (
    <div className="w-full rounded-lg bg-black/30 border border-cyan-400/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] focus-within:border-cyan-400/80 focus-within:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all duration-300">
      {image && (
        <div className="p-3">
          <div className="relative w-fit">
            <img src={image.previewUrl} alt="Preview" className="h-20 w-20 rounded-md object-cover border-2 border-cyan-400/50" />
            <button 
              onClick={() => {
                setImage(null);
                URL.revokeObjectURL(image.previewUrl);
              }}
              className="absolute -top-2 -right-2 bg-[#0a0f1f] rounded-full text-cyan-300 hover:text-cyan-100"
              aria-label="Remove image"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
      <div className="relative flex items-end">
        <div className="flex items-center pl-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 text-cyan-400 hover:text-cyan-200 transition-colors disabled:opacity-50"
            aria-label="Attach file"
            disabled={isLoading}
          >
            <PaperclipIcon className="h-5 w-5" />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          
          <button 
            onClick={toggleListening}
            className={`p-2 transition-colors disabled:opacity-50 ${isListening ? 'text-cyan-300 animate-pulse' : 'text-cyan-400 hover:text-cyan-200'}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            disabled={isLoading}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        </div>
        <textarea
            className="w-full flex-1 resize-none bg-transparent p-4 pr-12 text-gray-200 placeholder-cyan-400/40 focus:outline-none font-rajdhani text-lg"
            placeholder="Enter command..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
        />
        <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !image)}
            className="absolute bottom-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/20 text-cyan-300 transition-colors hover:bg-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:bg-gray-700/50 disabled:text-gray-500"
            aria-label="Send message"
        >
            {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-cyan-300"></div>
            ) : (
            <SendIcon className="h-5 w-5" />
            )}
        </button>
      </div>
    </div>
  );
};