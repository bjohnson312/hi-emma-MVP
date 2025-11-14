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

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      const errorMessage = event.error === 'not-allowed' 
        ? 'Microphone access was denied. Please allow microphone access in your browser settings.'
        : event.error === 'no-speech'
        ? 'No speech was detected. Please try again.'
        : event.error === 'network'
        ? 'Network error occurred. Please check your connection.'
        : `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      setError('Failed to stop speech recognition');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const restartListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    setError(null);
    
    if (isListening) {
      return new Promise<void>((resolve) => {
        const handleEnd = () => {
          recognitionRef.current.removeEventListener('end', handleEnd);
          try {
            recognitionRef.current.start();
            setIsListening(true);
            resolve();
          } catch (err) {
            console.error('Failed to start speech recognition after stop:', err);
            setError('Failed to start speech recognition');
            resolve();
          }
        };
        
        recognitionRef.current.addEventListener('end', handleEnd);
        
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('Error stopping recognition:', err);
          recognitionRef.current.removeEventListener('end', handleEnd);
          resolve();
        }
      });
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start speech recognition');
      }
    }
  }, [isListening]);

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
