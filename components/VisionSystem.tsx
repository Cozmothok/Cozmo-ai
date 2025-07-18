import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { EyeIcon } from './icons';

export interface VisionSystemHandle {
    captureFrame: () => string | null;
}

export const VisionSystem = forwardRef<VisionSystemHandle>((_props, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        
        const enableVideoStream = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'environment'
                    } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Camera access denied. Please grant permission in your browser settings.");
            }
        };

        enableVideoStream();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useImperativeHandle(ref, () => ({
        captureFrame: () => {
            const video = videoRef.current;
            if (video && video.readyState >= 2) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    return canvas.toDataURL('image/jpeg', 0.9); // Quality 90%
                }
            }
            return null;
        },
    }));

    return (
        <div className="relative w-full h-full max-w-sm mx-auto aspect-video bg-black rounded-lg overflow-hidden border-2 border-cyan-400/30 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            <div className="absolute top-2 left-2 flex items-center gap-2 text-xs text-white bg-red-600/80 px-2 py-1 rounded font-orbitron">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                LIVE FEED
            </div>
             {error && (
                <div className="absolute inset-0 bg-black/80 text-red-400 flex flex-col items-center justify-center p-4 text-center">
                    <EyeIcon className="w-10 h-10 mb-4" />
                    <h3 className="font-orbitron text-lg mb-2">VISION SYSTEM ERROR</h3>
                    <p className="text-sm font-rajdhani">{error}</p>
                </div>
            )}
        </div>
    );
});