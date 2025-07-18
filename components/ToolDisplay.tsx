import React from 'react';

interface ToolDisplayProps {
  toolCalls?: any[];
  toolResults?: any[];
}

const ToolDisplay: React.FC<ToolDisplayProps> = ({ toolCalls, toolResults }) => {
  if (toolCalls && toolCalls.length > 0) {
    return (
      <div className="bg-black/40 border border-cyan-400/30 rounded-lg p-4 my-2 animate-pulse">
        <p className="font-orbitron text-sm text-cyan-300">
          Executing Command: <span className="font-bold text-white">{toolCalls[0].name}</span>
        </p>
        <pre className="text-xs text-cyan-200/70 mt-2 bg-black/30 p-2 rounded">
          {JSON.stringify(toolCalls[0].args, null, 2)}
        </pre>
      </div>
    );
  }

  if (toolResults && toolResults.length > 0) {
    return (
      <div className="bg-black/30 border border-green-500/30 rounded-lg p-4 my-2">
        <p className="font-orbitron text-sm text-green-400">
          Command Result: <span className="font-bold text-white">{toolResults[0].name}</span>
        </p>
        <pre className="text-xs text-green-200/70 mt-2 bg-black/30 p-2 rounded">
          {JSON.stringify(toolResults[0].output, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
};

export default ToolDisplay;