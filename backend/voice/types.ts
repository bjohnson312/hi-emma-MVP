export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
}

export interface VoiceOption {
  id: string;
  name: string;
  type: 'browser' | 'elevenlabs';
  category?: string;
  description?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voiceId: string;
}
