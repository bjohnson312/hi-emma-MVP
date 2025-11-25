import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  restartListening: () => Promise<void>;
  resetTranscript: () => void;
  error: string | null;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const resultIndexRef = useRef(0);

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = resultIndexRef.current; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
          resultIndexRef.current = i + 1;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript(prev => {
        const newTranscript = prev + finalTranscript;
        return newTranscript + (interimTranscript && !finalTranscript ? interimTranscript : '');
      });
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech Recognition] Error:', event.error, '- Message:', event.message || 'No additional details');
      const errorMessage = event.error === 'not-allowed' 
        ? 'Microphone access was denied. Please allow microphone access in your browser settings.'
        : event.error === 'no-speech'
        ? 'No speech was detected. Please try again.'
        : event.error === 'network'
        ? 'Network error occurred. Please check your connection.'
        : event.error === 'aborted'
        ? 'Speech recognition was aborted. Please try again.'
        : `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[Speech Recognition] Session ended');
      setIsListening(false);
    };

    console.log('[Speech Recognition] New instance created');
    return recognition;
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          console.log('[Speech Recognition] Instance aborted on cleanup');
        } catch (e) {
          console.warn('[Speech Recognition] Cleanup abort failed:', e);
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (isListening) {
      console.warn('[Speech Recognition] Already listening, ignoring duplicate start');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        console.log('[Speech Recognition] Aborted previous instance');
      } catch (e) {
        console.warn('[Speech Recognition] Abort failed:', e);
      }
    }

    recognitionRef.current = createRecognition();
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }

    resultIndexRef.current = 0;
    setTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      console.log('[Speech Recognition] Started new session');
    } catch (err: any) {
      console.error('[Speech Recognition] Start failed:', err.name, err.message);
      setError('Failed to start speech recognition');
    }
  }, [isListening, createRecognition]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('[Speech Recognition] Stopped listening');
    } catch (err: any) {
      console.error('[Speech Recognition] Stop failed:', err.name, err.message);
      setError('Failed to stop speech recognition');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const restartListening = useCallback(async () => {
    console.log('[Speech Recognition] Restarting session');
    
    if (isListening) {
      return new Promise<void>((resolve) => {
        const handleEnd = () => {
          if (recognitionRef.current) {
            recognitionRef.current.removeEventListener('end', handleEnd);
          }
          startListening();
          resolve();
        };
        
        if (recognitionRef.current) {
          recognitionRef.current.addEventListener('end', handleEnd);
          
          try {
            recognitionRef.current.stop();
          } catch (err: any) {
            console.warn('[Speech Recognition] Restart stop failed:', err.name, err.message);
            if (recognitionRef.current) {
              recognitionRef.current.removeEventListener('end', handleEnd);
            }
            resolve();
          }
        } else {
          resolve();
        }
      });
    } else {
      startListening();
    }
  }, [isListening, startListening]);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    restartListening,
    resetTranscript,
    error,
  };
}
