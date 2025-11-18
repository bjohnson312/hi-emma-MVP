import type {
  ApiResponse,
  TranscribeRequest,
  TranscribeResponse,
  SynthesizeRequest,
  SynthesizeResponse,
  Voice,
  VoicePreference,
} from '../types';

export const speechRoutes = {
  transcribe,
  synthesize,
  getVoices,
  getVoicePreference,
  updateVoicePreference,
};

async function transcribe(req: TranscribeRequest): Promise<ApiResponse<TranscribeResponse>> {
  return {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Speech-to-text transcription endpoint not yet implemented',
      details: 'This is a CRITICAL endpoint for mobile support',
    },
    meta: { timestamp: new Date().toISOString() },
  };
}

async function synthesize(req: SynthesizeRequest): Promise<ApiResponse<SynthesizeResponse>> {
  return {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Text-to-speech synthesis endpoint not yet implemented',
      details: 'This is a CRITICAL endpoint for mobile support',
    },
    meta: { timestamp: new Date().toISOString() },
  };
}

async function getVoices(): Promise<ApiResponse<Voice[]>> {
  return {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Get available voices endpoint not yet implemented',
    },
    meta: { timestamp: new Date().toISOString() },
  };
}

async function getVoicePreference(): Promise<ApiResponse<VoicePreference>> {
  return {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Get voice preference endpoint not yet implemented',
    },
    meta: { timestamp: new Date().toISOString() },
  };
}

async function updateVoicePreference(voiceId: string): Promise<ApiResponse<VoicePreference>> {
  return {
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Update voice preference endpoint not yet implemented',
    },
    meta: { timestamp: new Date().toISOString() },
  };
}
