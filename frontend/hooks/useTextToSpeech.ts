import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoicePreference } from './useVoicePreference';
import backend from '~backend/client';
import type { VoiceOption } from '~backend/voice/types';

interface UseTextToSpeechResult {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  elevenLabsVoices: VoiceOption[];
  selectedElevenLabsVoice: VoiceOption | null;
  setSelectedElevenLabsVoice: (voice: VoiceOption | null) => void;
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<VoiceOption[]>([]);
  const [selectedElevenLabsVoice, setSelectedElevenLabsVoice] = useState<VoiceOption | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { savedVoicePreference, saveVoicePreference } = useVoicePreference();

  const isSupported = 'speechSynthesis' in window;

  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      try {
        const { voices: elVoices } = await backend.voice.listVoices();
        setElevenLabsVoices(elVoices);
        
        if (savedVoicePreference?.type === 'elevenlabs') {
          const savedVoice = elVoices.find(v => v.name === savedVoicePreference.name);
          if (savedVoice) {
            setSelectedElevenLabsVoice(savedVoice);
            setSelectedVoice(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch ElevenLabs voices:', error);
      }
    };
    fetchElevenLabsVoices();
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (availableVoices.length > 0 && !selectedVoice) {
        let voiceToSelect = null;

        if (savedVoicePreference?.type === 'browser') {
          voiceToSelect = availableVoices.find(voice => voice.name === savedVoicePreference.name);
        }

        if (!voiceToSelect) {
          voiceToSelect = availableVoices.find(voice => 
            voice.lang.includes('en-US') && 
            !voice.localService &&
            (voice.name.toLowerCase().includes('female') ||
             voice.name.toLowerCase().includes('woman') ||
             !voice.name.toLowerCase().includes('male'))
          );

          if (!voiceToSelect) {
            voiceToSelect = availableVoices.find(voice => 
              voice.lang.includes('en-US') && 
              !voice.localService
            );
          }

          if (!voiceToSelect) {
            const calmingVoices = [
              'Samantha',
              'Ava',
              'Allison',
              'Nicky',
              'Google US English Female',
              'Microsoft Aria',
              'Microsoft Jenny',
              'Victoria',
              'Karen',
              'Moira',
              'Tessa',
              'Fiona',
              'Veena',
              'Google UK English Female',
              'Microsoft Zira'
            ];

            for (const calmingName of calmingVoices) {
              voiceToSelect = availableVoices.find(voice => 
                voice.name.includes(calmingName)
              );
              if (voiceToSelect) break;
            }
          }

          if (!voiceToSelect) {
            voiceToSelect = availableVoices.find(voice => 
              voice.lang.includes('en-US') && 
              (voice.name.toLowerCase().includes('female') ||
               voice.name.toLowerCase().includes('woman') ||
               !voice.name.toLowerCase().includes('male'))
            );
          }

          if (!voiceToSelect) {
            voiceToSelect = availableVoices.find(voice => 
              voice.lang.startsWith('en') && 
              (voice.name.toLowerCase().includes('female') ||
               voice.name.toLowerCase().includes('woman') ||
               !voice.name.toLowerCase().includes('male'))
            );
          }
        }

        setSelectedVoice(voiceToSelect || availableVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported, savedVoicePreference]);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    stop();

    if (selectedElevenLabsVoice) {
      try {
        setIsSpeaking(true);
        const { audioUrl } = await backend.voice.generateSpeech({
          text,
          voiceId: selectedElevenLabsVoice.id,
        });
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
        };
        
        await audio.play();
      } catch (error) {
        console.error('ElevenLabs speech error:', error);
        setIsSpeaking(false);
      }
    } else if (isSupported && selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.voice = selectedVoice;
      utterance.rate = 0.92;
      utterance.pitch = 1.08;
      utterance.volume = 0.95;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isSupported, selectedVoice, selectedElevenLabsVoice]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const handleSetSelectedVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setSelectedVoice(voice);
    setSelectedElevenLabsVoice(null);
    if (voice) {
      saveVoicePreference(voice.name, 'browser');
    }
  }, [saveVoicePreference]);

  const handleSetSelectedElevenLabsVoice = useCallback((voice: VoiceOption | null) => {
    setSelectedElevenLabsVoice(voice);
    setSelectedVoice(null);
    if (voice) {
      saveVoicePreference(voice.name, 'elevenlabs', voice.id);
    }
  }, [saveVoicePreference]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice: handleSetSelectedVoice,
    elevenLabsVoices,
    selectedElevenLabsVoice,
    setSelectedElevenLabsVoice: handleSetSelectedElevenLabsVoice,
  };
}
