# Microphone Setup - Code Backup (Before iOS Safari Fix)

This file contains the original code for easy revert if needed.

## Date: 2025-11-14

## Files backed up:
1. `/frontend/components/MicrophoneSetup.tsx`
2. `/frontend/hooks/useSpeechRecognition.ts`
3. `/frontend/components/ConversationalCheckIn.tsx`

---

## MicrophoneSetup.tsx (Original)

```tsx
import { useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, Settings2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface MicrophoneSetupProps {
  onComplete?: () => void;
}

export default function MicrophoneSetup({ onComplete }: MicrophoneSetupProps) {
  const [step, setStep] = useState<'intro' | 'testing' | 'success'>('intro');
  const [testTranscript, setTestTranscript] = useState('');
  
  const {
    transcript,
    isListening,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError
  } = useSpeechRecognition();

  const {
    speak,
    isSupported: isTTSSupported
  } = useTextToSpeech();

  const handleStartTest = useCallback(async () => {
    setStep('testing');
    setTestTranscript('');
    resetTranscript();
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isTTSSupported) {
        speak("Let's test your microphone. Please say: Hello Emma");
      }
      
      setTimeout(() => {
        startListening();
      }, isTTSSupported ? 3000 : 500);
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStep('intro');
        alert('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
      } else {
        setStep('intro');
        alert('Unable to access microphone. Please check your browser settings.');
      }
    }
  }, [startListening, speak, resetTranscript, isTTSSupported]);

  const handleStopTest = useCallback(() => {
    stopListening();
    if (transcript.trim()) {
      setTestTranscript(transcript);
      setStep('success');
      
      if (isTTSSupported) {
        speak("Great! Your microphone is working perfectly. You're all set to chat with me.");
      }
    }
  }, [stopListening, transcript, speak, isTTSSupported]);

  const handleTryAgain = useCallback(() => {
    setStep('intro');
    setTestTranscript('');
    resetTranscript();
  }, [resetTranscript]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  if (!isSpeechSupported) {
    return (
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/40">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#323e48]">Speech Not Supported</h2>
          <p className="text-[#323e48]/70">
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for the best voice experience.
          </p>
          <Button
            onClick={handleComplete}
            className="bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white"
          >
            Continue Without Voice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/40">
      {step === 'intro' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20 flex items-center justify-center">
              <Mic className="w-10 h-10 text-[#4e8f71]" />
            </div>
            <h2 className="text-3xl font-bold text-[#323e48] mb-2">Set Up Your Microphone</h2>
            <p className="text-[#323e48]/70 text-lg">
              Let's make sure Emma can hear you clearly
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#4e8f71] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-[#323e48]">Allow Microphone Access</p>
                <p className="text-sm text-[#323e48]/70">When prompted, click "Allow" to grant microphone permissions</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#364d89] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-[#323e48]">Test Your Voice</p>
                <p className="text-sm text-[#323e48]/70">We'll ask you to say a short phrase to test the microphone</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#6656cb] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-[#323e48]">Start Chatting</p>
                <p className="text-sm text-[#323e48]/70">Once verified, you can speak naturally with Emma</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartTest}
              className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white py-6 rounded-2xl text-lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Test Microphone
            </Button>
            <Button
              onClick={handleComplete}
              variant="outline"
              className="border-[#4e8f71]/30 hover:bg-[#4e8f71]/10 py-6 rounded-2xl"
            >
              Skip
            </Button>
          </div>
        </div>
      )}

      {step === 'testing' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isListening ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-[#4e8f71]/20 to-[#364d89]/20'
            }`}>
              {isListening ? (
                <MicOff className="w-12 h-12 text-white" />
              ) : (
                <Volume2 className="w-12 h-12 text-[#4e8f71]" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#323e48] mb-2">
              {isListening ? 'Listening...' : 'Getting Ready...'}
            </h2>
            <p className="text-[#323e48]/70">
              {isListening ? 'Say: "Hello Emma"' : 'Starting microphone...'}
            </p>
          </div>

          {transcript && (
            <div className="bg-white/90 rounded-2xl p-4 border border-[#4e8f71]/20">
              <p className="text-sm text-[#323e48]/60 mb-1">We heard:</p>
              <p className="text-lg font-medium text-[#323e48]">"{transcript}"</p>
            </div>
          )}

          {speechError && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-1">Microphone Issue</p>
              <p className="text-sm text-red-600">{speechError}</p>
              {speechError.includes('denied') && (
                <p className="text-xs text-red-500 mt-2">
                  To fix: Click the 🔒 or ⓘ icon in your browser's address bar and allow microphone access.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {isListening ? (
              <Button
                onClick={handleStopTest}
                disabled={!transcript.trim()}
                className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white py-6 rounded-2xl text-lg"
              >
                Finish Test
              </Button>
            ) : (
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="flex-1 border-[#4e8f71]/30 hover:bg-[#4e8f71]/10 py-6 rounded-2xl"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-[#323e48] mb-2">All Set!</h2>
            <p className="text-[#323e48]/70 text-lg">
              Your microphone is working perfectly
            </p>
          </div>

          {testTranscript && (
            <div className="bg-gradient-to-r from-[#4e8f71]/10 to-[#364d89]/10 rounded-2xl p-6">
              <p className="text-sm text-[#323e48]/60 mb-2">You said:</p>
              <p className="text-xl font-medium text-[#323e48]">"{testTranscript}"</p>
            </div>
          )}

          <div className="bg-white/90 rounded-2xl p-6 border border-[#4e8f71]/20 space-y-3">
            <h3 className="font-semibold text-[#323e48]">Quick Tips:</h3>
            <ul className="space-y-2 text-sm text-[#323e48]/70">
              <li className="flex items-start gap-2">
                <span className="text-[#4e8f71]">•</span>
                <span>Click the microphone button anytime to start speaking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4e8f71]">•</span>
                <span>Speak naturally - Emma will understand you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4e8f71]">•</span>
                <span>The microphone button will pulse red when listening</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4e8f71]">•</span>
                <span>You can also type if you prefer</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleComplete}
              className="flex-1 bg-gradient-to-r from-[#4e8f71] to-[#364d89] hover:from-[#3d7259] hover:to-[#2a3d6f] text-white py-6 rounded-2xl text-lg"
            >
              Start Chatting with Emma
            </Button>
            <Button
              onClick={handleTryAgain}
              variant="outline"
              className="border-[#4e8f71]/30 hover:bg-[#4e8f71]/10 py-6 rounded-2xl"
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## To Revert:
Simply copy the code above back into `/frontend/components/MicrophoneSetup.tsx`
