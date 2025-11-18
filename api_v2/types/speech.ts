export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'webm';

export interface TranscribeRequest {
  audioData: string;
  format: AudioFormat;
  language?: string;
}

export interface TranscribeResponse {
  transcript: string;
  confidence: number;
  words?: WordTimestamp[];
  language?: string;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SynthesizeRequest {
  text: string;
  voiceId: string;
  speed?: number;
  format?: 'mp3' | 'wav';
}

export interface SynthesizeResponse {
  audioUrl: string;
  duration: number;
  expiresAt: string;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  description?: string;
  previewUrl?: string;
}

export interface VoicePreference {
  userId: string;
  voiceId: string;
  updatedAt: string;
}
