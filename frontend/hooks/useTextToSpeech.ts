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
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<VoiceOption[]>([]);
  const [selectedElevenLabsVoice, setSelectedElevenLabsVoice] = useState<VoiceOption | null>(() => {
    // Initialize from localStorage for immediate voice availability on mount
    if (typeof window === 'undefined') return null;
    
    const voiceType = localStorage.getItem('emma-voice-type');
    if (voiceType === 'elevenlabs') {
      const name = localStorage.getItem('emma-voice-preference');
      const id = localStorage.getItem('emma-voice-id');
      if (name && id) {
        return {
          id,
          name,
          type: 'elevenlabs' as const,
        };
      }
    }
    return null;
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInstancesRef = useRef<Set<HTMLAudioElement>>(new Set());
  const { savedVoicePreference, saveVoicePreference } = useVoicePreference();

  const isSupported = 'speechSynthesis' in window;

  // Fetch ElevenLabs voices on mount
  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      try {
        const { voices: elVoices } = await backend.voice.listVoices();
        setElevenLabsVoices(elVoices);
      } catch (error) {
        console.error('Failed to fetch ElevenLabs voices:', error);
      }
    };
    fetchElevenLabsVoices();
  }, []); // Empty dependency = runs once on mount

  // Apply voice preference when voices load or preference changes
  useEffect(() => {
    if (elevenLabsVoices.length === 0) return; // Wait for voices to load
    
    if (savedVoicePreference?.type === 'elevenlabs') {
      const savedVoice = elevenLabsVoices.find(v => v.name === savedVoicePreference.name);
      if (savedVoice) {
        console.log('Updating saved ElevenLabs voice with full data:', savedVoice.name);
        setSelectedElevenLabsVoice(savedVoice);
        setSelectedVoice(null);
      }
    } else if (!savedVoicePreference && elevenLabsVoices.length > 0) {
      const trinityVoice = elevenLabsVoices.find(v => v.name.toLowerCase().includes('trinity'));
      if (trinityVoice) {
        console.log('No saved preference, auto-selecting Trinity:', trinityVoice.name);
        setSelectedElevenLabsVoice(trinityVoice);
        setSelectedVoice(null);
        saveVoicePreference(trinityVoice.name, 'elevenlabs', trinityVoice.id);
      } else {
        console.warn('Trinity voice not found in list. Available voices:', elevenLabsVoices.map(v => v.name));
      }
    }
  }, [elevenLabsVoices, savedVoicePreference, saveVoicePreference]);

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

  const stop = useCallback(() => {
    audioInstancesRef.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      } catch (e) {
      }
    });
    audioInstancesRef.current.clear();
    
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (e) {}
      audioRef.current = null;
    }
    
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    setCurrentlySpeakingText(null);
  }, [isSupported]);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    
    if (currentlySpeakingText === text && isSpeaking) {
      console.log('[TTS] Already speaking this message, ignoring duplicate call');
      return;
    }

    stop();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setCurrentlySpeakingText(text);

    if (selectedElevenLabsVoice) {
      try {
        setIsSpeaking(true);
        const { audioUrl } = await backend.voice.generateSpeech({
          text,
          voiceId: selectedElevenLabsVoice.id,
        });
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioInstancesRef.current.add(audio);
        
        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentlySpeakingText(null);
          audioInstancesRef.current.delete(audio);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setCurrentlySpeakingText(null);
          audioInstancesRef.current.delete(audio);
        };
        
        await audio.play();
      } catch (error) {
        console.error('ElevenLabs speech error:', error);
        setIsSpeaking(false);
        setCurrentlySpeakingText(null);
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
        setCurrentlySpeakingText(null);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingText(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isSupported, selectedVoice, selectedElevenLabsVoice, currentlySpeakingText, isSpeaking, stop]);

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
