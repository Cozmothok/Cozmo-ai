import React from 'react';
import { HexagonIcon, MagnifyingGlassIcon } from './icons';

interface WelcomeProps {
  onExampleClick: (prompt: string) => void;
}

const examples = [
  { title: "Check Device Status", prompt: "What is my current device status?" },
  { title: "Set a Reminder", prompt: "Set a reminder for me in 10 seconds to check system diagnostics" },
  { title: "Open a Website", prompt: "Open google.com for me" },
  { title: "Access Web Data", prompt: "/search Who won the last Formula 1 race?", icon: MagnifyingGlassIcon }
];

export const Welcome: React.FC<WelcomeProps> = ({ onExampleClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="relative mb-4 h-20 w-20 flex items-center justify-center">
        <HexagonIcon className="h-full w-full text-cyan-400/50 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute h-8 w-8 rounded-full bg-cyan-400 animate-glow"></div>
      </div>
      <h1 className="font-orbitron text-5xl font-bold mb-8 text-cyan-300" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
        Awaiting Directives
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {examples.map((example, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(example.prompt)}
            className="p-4 bg-black/20 rounded-lg border border-cyan-400/20 hover:bg-cyan-900/50 hover:border-cyan-400/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              {example.icon && <example.icon className="h-5 w-5 text-cyan-400/70" />}
              <h2 className="font-orbitron font-semibold text-cyan-300 group-hover:text-white">{example.title}</h2>
            </div>
            <p className="text-sm text-cyan-100/60 font-rajdhani line-clamp-2 mt-1">{example.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};