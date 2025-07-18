import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from './types';
import { chat, generateImage, searchWeb } from './services/geminiService';
import { getGroqChatCompletion } from './services/groqService';
import { ChatMessage } from './components/Message';
import { MessageInput } from './components/MessageInput';
import { Welcome } from './components/Welcome';
import { GenerateContentResponse, Part } from '@google/genai';
import { AIAvatar } from './components/AIAvatar';
import { useTextToSpeech } from './useTextToSpeech';
import { SpeakerWaveIcon, SpeakerXMarkIcon, EyeIcon } from './components/icons';
import { VisionSystem, VisionSystemHandle } from './components/VisionSystem';


const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const base64ToGenerativePart = (base64Data: string): Part => {
    return {
        inlineData: {
            data: base64Data.split(',')[1],
            mimeType: 'image/jpeg'
        }
    };
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('cozmoChatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVisionMode, setIsVisionMode] = useState<boolean>(false);
  const { isSpeaking, speak, cancel } = useTextToSpeech();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<VisionSystemHandle>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('cozmoChatHistory', JSON.stringify(messages));
  }, [messages]);

  // --- Client-side Tool Implementations ---
  const tools: {[key: string]: (...args: any[]) => any} = {
    check_device_status: async () => {
        const battery = await (navigator as any).getBattery();
        return {
            battery: {
                level: `${(battery.level * 100).toFixed(0)}%`,
                charging: battery.charging
            },
            online: navigator.onLine
        }
    },
    set_reminder: ({time, message}: {time: number, message: string}) => {
        setTimeout(() => {
            alert(`Reminder, Sir: ${message}`);
            speak(`Reminder, Sir: ${message}`);
        }, time * 1000);
        return { success: true, message: `Reminder set for ${time} seconds.` };
    },
    get_location: () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ 
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                (error) => reject(new Error(error.message))
            );
        });
    },
    open_website: ({url}: {url: string}) => {
        window.open(url, '_blank');
        return { success: true, url };
    }
  };

  const handleSendMessage = async (text: string, image?: { file: File, previewUrl: string }) => {
    if (isLoading || (!text.trim() && !image)) return;
    
    // Cancel any ongoing speech from a previous, unrelated turn.
    cancel();

    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    const userMessage: Message = { id: `user-${Date.now()}`, role: Role.USER, content: text, imageUrl: image?.previewUrl };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        const visionKeywords = ['look', 'see', 'analyze', 'what is', 'what am i', 'describe', 'identify', 'camera'];
        const searchKeywords = ['search', 'find on web', 'look up', 'what is', 'tell me about']; // Added search keywords
        const useVision = isVisionMode && visionKeywords.some(kw => text.toLowerCase().includes(kw));
        const performSearch = searchKeywords.some(kw => text.toLowerCase().includes(kw)); // Check for search keywords

        let messageParts: Part[] = [];

        if (useVision) {
            const frame = visionRef.current?.captureFrame();
            if (!frame) throw new Error("Could not capture frame from vision system.");
            
            messageParts.push(base64ToGenerativePart(frame));
        } else if (image) {
            messageParts.push(await fileToGenerativePart(image.file));
        }

        if (text) {
            messageParts.push({ text });
        }

        if (performSearch) {
            const { text: searchText, sources } = await searchWeb(text);
            const botMessage: Message = { id: `model-search-${Date.now()}`, role: Role.MODEL, content: searchText, sources };
            setMessages(prev => [...prev, botMessage]);
            if (isAudioEnabled) speak("I have retrieved the requested data from the web, Operator.");
            setIsLoading(false); // Stop loading after search
            return; // Exit function after performing search
        }
        
        // Prepare history for the model
        const history = messages.map(msg => {
            const parts: Part[] = [];
            if (msg.content) {
                parts.push({ text: msg.content as string });
            }
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                msg.toolCalls.forEach((call: any) => {
                    parts.push({ functionCall: call });
                });
            }
            if (msg.toolResults && msg.toolResults.length > 0) {
                msg.toolResults.forEach((result: any) => {
                    parts.push({ functionResponse: { name: result.name, response: result.output } });
                });
            }
            return {
                role: msg.role === Role.USER ? 'user' : 'model',
                parts: parts
            };
        });

        // --- Start of multi-turn function calling loop ---
        let response = await chat.sendMessage({ history: history, message: messageParts, signal: currentAbortController.signal });

        while(true) {
            const toolCalls = response.candidates?.[0]?.content?.parts.filter(part => !!part.functionCall);

            if (!toolCalls || toolCalls.length === 0) {
                // No tool calls, this is the final text response
                const finalResponse = response.text;
                const botMessage: Message = { id: `model-${Date.now()}`, role: Role.MODEL, content: finalResponse };
                setMessages(prev => [...prev, botMessage]);
                if (isAudioEnabled) speak(finalResponse);
                break; // Exit loop
            }

            // It's a tool call
            const toolCallMessage: Message = { id: `model-${Date.now()}`, role: Role.MODEL, content: "", toolCalls: toolCalls.map(tc => tc.functionCall) };
            setMessages(prev => [...prev, toolCallMessage]);
            if (isAudioEnabled) speak(`Executing command, Sir.`);

            const functionCall = toolCalls[0].functionCall;
            if (!functionCall) {
                throw new Error("Invalid tool call structure received from model.");
            }

            const toolResult = await tools[functionCall.name](functionCall.args);
            const toolResultMessage: Message = { id: `model-${Date.now()}-result`, role: Role.MODEL, content: "", toolResults: [{ name: functionCall.name, output: toolResult }]};
            setMessages(prev => [...prev, toolResultMessage]);

            // Send tool result back to the model
            response = await chat.sendMessage({
                message: [
                    {
                        functionResponse: {
                            name: functionCall.name,
                            response: toolResult
                        }
                    }
                ],
                signal: currentAbortController.signal
            });
        }
        // --- End of loop ---

    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.log("Request aborted by user.");
            // Do not display an error message for intentional aborts
        } else {
            console.error("Error processing message:", error);
            const errorMessage = `Apologies, Sir. I've encountered a system malfunction. ${error instanceof Error ? error.message : 'Please check the console.'}`;
            const botMessage: Message = { id: `model-${Date.now()}`, role: Role.MODEL, content: errorMessage };
            setMessages(prev => [...prev, botMessage]);
            if(isAudioEnabled) speak(errorMessage);
        }
    } finally {
        setIsLoading(false);
        abortControllerRef.current = null; // Clear the controller after the request is done or aborted
        if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    }
  };

  // Simplified handlers to route to the main `handleSendMessage`
  const handleSpecialCommands = async (prompt: string) => {
    const userMessage: Message = { id: `user-${Date.now()}`, role: Role.USER, content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        if (prompt.toLowerCase().startsWith('/imagine')) {
            const cleanPrompt = prompt.replace('/imagine', '').trim();
            if (!cleanPrompt) throw new Error("Imagine prompt cannot be empty.");

            const botMessageId = `model-img-${Date.now()}`;
            const botMessagePlaceholder: Message = { id: botMessageId, role: Role.MODEL, content: prompt, imageUrl: '' };
            setMessages(prev => [...prev, botMessagePlaceholder]);

            const base64Image = await generateImage(cleanPrompt);
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, imageUrl: imageUrl } : msg));
            if (isAudioEnabled) speak("Holographic image generation complete, Sir.");
        }
    } catch(error) {
        console.error("Special command error:", error);
        const errorMessage = `Command failed, Sir. ${error instanceof Error ? error.message : 'Please try again.'}`;
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: Role.MODEL, content: errorMessage }]);
        if(isAudioEnabled) speak(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const masterSendHandler = (text: string, image?: { file: File, previewUrl: string }) => {
    const trimmedText = text.trim();
    if (trimmedText.startsWith('/')) {
        handleSpecialCommands(trimmedText);
    } else {
        handleSendMessage(text, image);
    }
  };
  
  const handleWelcomeClick = (prompt: string) => { masterSendHandler(prompt); };
  
  const toggleAudio = () => {
    if (isSpeaking) cancel();
    if (isLoading) {
      setIsLoading(false);
      setMessages(prev => prev.slice(0, -1)); // Remove the last user message that triggered loading
    }
    setIsAudioEnabled(prev => !prev);
  }

  const handleVoiceInputStart = () => {
    cancel(); // Stop any ongoing speech
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort any ongoing AI generation
    }
    if (isLoading) {
      setIsLoading(false);
      setMessages(prev => prev.slice(0, -1)); // Remove the last user message that triggered loading
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <div className="flex flex-col md:flex-row h-screen w-full bg-[#0a0f1f] text-gray-200 font-rajdhani">
              <div className="flex flex-col p-2 space-y-2 bg-black/20 items-center justify-center md:p-4 md:space-y-4 md:w-1/3 md:max-w-sm md:space-y-6 border-r-2 border-cyan-400/20 shadow-2xl shadow-cyan-900/50">
                  {isVisionMode ? <VisionSystem ref={visionRef} /> : <AIAvatar isSpeaking={isSpeaking} />}
                  <h2 className="font-orbitron text-xl md:text-3xl font-bold text-cyan-300 tracking-widest" style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.7)'}}>
                    C.O.Z.M.O AI
                  </h2>
                  <div className="flex items-center gap-2">
                      <button 
                          onClick={toggleAudio}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 hover:bg-cyan-400/20 transition-colors text-cyan-300"
                      >
                          {isAudioEnabled ? <SpeakerWaveIcon className="h-5 w-5" /> : <SpeakerXMarkIcon className="h-5 w-5 text-red-500/70" />}
                          <span className="text-xs font-medium uppercase tracking-wider">{isAudioEnabled ? "Audio On" : "Audio Off"}</span>
                      </button>
                      <button 
                          onClick={() => setIsVisionMode(prev => !prev)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isVisionMode ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-200' : 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20'}`}
                      >
                          <EyeIcon className="h-5 w-5" />
                          <span className="text-xs font-medium uppercase tracking-wider">{isVisionMode ? "Vision On" : "Vision Off"}</span>
                      </button>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Link to="/login" className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">Login</Link>
                    <Link to="/register" className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold">Register</Link>
                  </div>
              </div>

              <div className="flex flex-1 flex-col min-h-0 bg-black/10">
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#06b6d4_transparent]">
                      {messages.length === 0 ? <Welcome onExampleClick={handleWelcomeClick} /> : <div>{messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}</div>}
                  </div>
                  
                  <div className="w-full bg-[#0a0f1f]/80 pt-2 pb-4 backdrop-blur-sm border-t border-cyan-400/20">
                      <div className="mx-auto max-w-4xl px-2 md:px-4">
                          <MessageInput onSendMessage={masterSendHandler} isLoading={isLoading} onVoiceInputStart={handleVoiceInputStart} />
                          <p className="text-center text-xs text-cyan-400/50 mt-2 px-2 font-rajdhani">
                              C.O.Z.M.O AI v1.0. Flash Module Active. System status: Nominal.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;