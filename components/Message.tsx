import React from 'react';
import { Role, Message } from '../types';
import { HexagonIcon, ImageIcon, GlobeAltIcon } from './icons';
import ToolDisplay from './ToolDisplay';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypingIndicator: React.FC = () => (
    <div className="flex items-center justify-start gap-1 h-8">
        <span className="h-2 w-1 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-cyan-400 delay-0"></span>
        <span className="h-4 w-1 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-cyan-400 delay-150"></span>
        <span className="h-3 w-1 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-cyan-400 delay-300"></span>
        <span className="h-5 w-1 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-cyan-400 delay-450"></span>
    </div>
);

const UserAvatar: React.FC = () => (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <HexagonIcon className="h-full w-full text-blue-500/50" />
        <span className="absolute font-bold text-sm text-gray-200 font-orbitron">Y</span>
    </div>
);

const BotAvatar: React.FC = () => (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <HexagonIcon className="h-full w-full text-cyan-400/50" />
        <div className="absolute h-4 w-4 rounded-full bg-cyan-400 animate-pulse"></div>
    </div>
);

const ImageGenerationMessage: React.FC<{ message: Message }> = ({ message }) => {
    return (
        <div className="p-4 bg-black/30 rounded-lg border border-cyan-400/20 flex flex-col gap-3">
            <div className='flex items-center gap-2 text-cyan-400'>
                <ImageIcon className="h-5 w-5" />
                <span className="font-bold text-cyan-300 font-orbitron text-sm tracking-wider">IMAGE GENERATION PROTOCOL</span>
            </div>
            <p className='text-gray-300 font-rajdhani'>{typeof message.content === 'string' && message.content.replace('/imagine', 'Prompt:')}</p>
            {message.imageUrl ? (
                <img src={message.imageUrl} alt="Generated image" className="rounded-lg max-w-sm border-2 border-cyan-400/30 shadow-lg shadow-cyan-500/10" />
            ) : (
                <div className="w-full h-64 bg-black/20 animate-pulse rounded-lg flex items-center justify-center border border-dashed border-cyan-400/30">
                    <p className="text-cyan-400/70 font-rajdhani font-semibold">Generating holographic image...</p>
                </div>
            )}
        </div>
    );
}

const SourceCitations: React.FC<{ sources: Array<{ uri: string; title: string }> }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-cyan-400/20">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-cyan-300 font-orbitron tracking-wider mb-2">
                <GlobeAltIcon className="h-4 w-4"/>
                RETRIEVED FROM THE WEB
            </h3>
            <div className="space-y-2">
                {sources.map((source, index) => (
                    <a 
                        key={index} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block text-sm text-cyan-400/80 hover:text-cyan-300 truncate transition-colors duration-200"
                    >
                       {index + 1}. {source.title || source.uri}
                    </a>
                ))}
            </div>
        </div>
    );
};

export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const contentAsString = Array.isArray(message.content) ? message.content.find(p => typeof p === 'string' || p.text)?.text || '' : message.content;
  const isModelLoading = message.role === Role.MODEL && !contentAsString && !message.imageUrl && !message.toolCalls && !message.toolResults;
  const isImageGen = message.role === Role.MODEL && typeof message.content === 'string' && message.content.startsWith('/imagine');
  
  const containerClasses = "flex items-start gap-2 max-w-4xl mx-auto px-2 md:px-4";
  const messageBgClass = isUser 
    ? '' 
    : 'bg-gradient-to-r from-cyan-900/10 to-transparent';

  return (
    <div className={`w-full py-6 ${messageBgClass}`}>
      <div className={`${containerClasses} relative`}>
        {/* Glowing side-border */}
        <div className={`absolute left-0 top-0 h-full w-1 ${isUser ? 'bg-blue-500/50' : 'bg-cyan-400/50'}`}></div>

        <div className="pl-4">
            {isUser ? <UserAvatar /> : <BotAvatar />}
        </div>
        
        <div className="flex-1 pt-1 space-y-3 whitespace-pre-wrap">
          {message.imageUrl && !isImageGen && (
            <img src={message.imageUrl} alt="Chat attachment" className="rounded-lg max-w-xs border-2 border-blue-500/30" />
          )}
          
          <ToolDisplay toolCalls={message.toolCalls} toolResults={message.toolResults} />

          {isImageGen ? (
            <ImageGenerationMessage message={message} />
          ) : (
            <div className="prose prose-invert prose-p:text-gray-300 prose-p:font-rajdhani prose-p:text-base prose-strong:text-cyan-300 prose-strong:font-orbitron">
               {isModelLoading ? <TypingIndicator /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentAsString}</ReactMarkdown>}
            </div>
          )}

          <SourceCitations sources={message.sources || []} />
        </div>
      </div>
    </div>
  );
};