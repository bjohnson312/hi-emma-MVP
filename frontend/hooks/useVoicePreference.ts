import { useEffect, useState } from 'react';

const VOICE_PREFERENCE_KEY = 'emma-voice-preference';
const VOICE_TYPE_KEY = 'emma-voice-type';

interface VoicePreference {
  name: string;
  type: 'browser' | 'elevenlabs';
  id?: string;
}

export function useVoicePreference() {
  const [savedVoicePreference, setSavedVoicePreference] = useState<VoicePreference | null>(() => {
    if (typeof window === 'undefined') return null;
    const name = localStorage.getItem(VOICE_PREFERENCE_KEY);
    const type = localStorage.getItem(VOICE_TYPE_KEY) as 'browser' | 'elevenlabs' | null;
    if (!name || !type) return null;
    return { name, type };
  });

  const saveVoicePreference = (name: string, type: 'browser' | 'elevenlabs', id?: string) => {
    localStorage.setItem(VOICE_PREFERENCE_KEY, name);
    localStorage.setItem(VOICE_TYPE_KEY, type);
    if (id) {
      localStorage.setItem('emma-voice-id', id);
    }
    setSavedVoicePreference({ name, type, id });
  };

  const clearVoicePreference = () => {
    localStorage.removeItem(VOICE_PREFERENCE_KEY);
    localStorage.removeItem(VOICE_TYPE_KEY);
    localStorage.removeItem('emma-voice-id');
    setSavedVoicePreference(null);
  };

  return {
    savedVoicePreference,
    saveVoicePreference,
    clearVoicePreference,
  };
}
