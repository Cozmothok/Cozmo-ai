import React from 'react';

const styles = `
@keyframes rotate-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes rotate-ccw {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 15px 5px rgba(0, 255, 255, 0.4); }
  50% { transform: scale(1.1); box-shadow: 0 0 25px 10px rgba(0, 255, 255, 0.7); }
}
@keyframes speak-pulse {
  0%, 100% { transform: scale(1.05); box-shadow: 0 0 20px 8px rgba(0, 255, 255, 0.6); }
  50% { transform: scale(1.2); box-shadow: 0 0 35px 15px rgba(0, 255, 255, 0.9); }
}
`;

interface AIAvatarProps {
    isSpeaking: boolean;
}

const Ring: React.FC<{ size: string; duration: string; direction?: 'cw' | 'ccw'; className?: string }> = ({
  size,
  duration,
  direction = 'cw',
  className = '',
}) => (
  <div
    className={`absolute top-1/2 left-1/2 rounded-full border-2 border-cyan-400/50 ${className}`}
    style={{
      width: size,
      height: size,
      marginTop: `-${parseInt(size) / 2}px`,
      marginLeft: `-${parseInt(size) / 2}px`,
      animation: `${direction === 'cw' ? 'rotate-cw' : 'rotate-ccw'} ${duration} linear infinite`,
    }}
  ></div>
);

export const AIAvatar: React.FC<AIAvatarProps> = ({ isSpeaking }) => {
    const coreAnimation = isSpeaking ? 'speak-pulse 1s ease-in-out infinite' : 'pulse 4s ease-in-out infinite';

    return (
        <>
            <style>{styles}</style>
            <div className="relative w-40 h-40 md:w-56 md:h-56">
                {/* Core */}
                <div 
                    className="absolute top-1/2 left-1/2 w-16 h-16 md:w-24 md:h-24 bg-cyan-500 rounded-full"
                    style={{ 
                        transform: 'translate(-50%, -50%)',
                        animation: coreAnimation,
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="w-full h-full bg-gradient-to-br from-cyan-300 to-blue-500 rounded-full opacity-80"></div>
                </div>

                {/* Rings */}
                <Ring size="120px" duration="10s" className="border-cyan-400/80" />
                <Ring size="160px" duration="15s" direction="ccw" className="border-blue-500/60 border-dashed" />
                <Ring size="220px" duration="25s" className="border-cyan-200/40" />
                <Ring size="224px" duration="25s" className="border-cyan-200/20" />
            </div>
        </>
    );
};