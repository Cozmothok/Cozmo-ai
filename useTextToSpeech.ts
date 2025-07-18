import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utteranceQueueRef = useRef<string[]>([]);

    const updateVoices = useCallback(() => {
        setVoices(window.speechSynthesis.getVoices());
    }, []);

    useEffect(() => {
        // Delay initial voice loading slightly to give the browser time
        const timer = setTimeout(() => {
             updateVoices();
        }, 100);

        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
        
        return () => {
            clearTimeout(timer);
            window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [updateVoices]);

    const getVoice = useCallback((): SpeechSynthesisVoice | null => {
        if (!voices.length) return null;

        // Prioritize a more generic or "AI-like" sounding English voice.
        // This attempts to find a clear, neutral English voice, often found in 'en-US'.
        let bestVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
        if (bestVoice) return bestVoice;

        bestVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google'));
        if (bestVoice) return bestVoice;

        // Fallback to any English voice
        bestVoice = voices.find(v => v.lang.startsWith('en-'));
        if (bestVoice) return bestVoice;
        
        // Fallback to the first available voice if no English voice is found
        return voices[0] || null;
    }, [voices]);


    const processQueue = useCallback(() => {
        if (utteranceQueueRef.current.length === 0) {
            setIsSpeaking(false);
            return;
        }

        // This check prevents multiple utterances from being spoken at once.
        if (window.speechSynthesis.speaking) {
            return;
        }

        setIsSpeaking(true);
        const textToSpeak = utteranceQueueRef.current.shift();
        if (!textToSpeak) {
            processQueue();
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.voice = getVoice();
        
        utterance.onend = () => {
            // A short delay before processing the next item can help prevent race conditions.
            setTimeout(() => processQueue(), 50);
        };

        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            console.error(`Speech synthesis error: ${e.error}. Text: "${textToSpeak}"`);
            // Try to continue with the queue even if one item fails.
            setTimeout(() => processQueue(), 50);
        };

        window.speechSynthesis.speak(utterance);

    }, [getVoice]);


    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis || !text.trim()) return;
        
        // Sanitize markdown and split into sentences.
        const cleanText = text.replace(/[*_`]/g, '');
        const sentences = cleanText.match( /[^.!?\n]+[.!?\n]+/g ) || [cleanText];
        utteranceQueueRef.current.push(...sentences.map(s => s.trim()).filter(Boolean));
        
        // If not currently speaking, start processing the queue.
        if (!window.speechSynthesis.speaking) {
            processQueue();
        }
    }, [processQueue]);

    const cancel = useCallback(() => {
        utteranceQueueRef.current = [];
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    return { isSpeaking, speak, cancel };
};