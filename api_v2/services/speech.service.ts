import type {
  TranscribeRequest,
  TranscribeResponse,
  SynthesizeRequest,
  SynthesizeResponse,
  Voice,
  VoicePreference,
} from '../types';

export class SpeechService {
  async transcribe(req: TranscribeRequest): Promise<TranscribeResponse> {
    throw new Error('transcribe() not implemented - CRITICAL for mobile support');
  }

  async synthesize(req: SynthesizeRequest): Promise<SynthesizeResponse> {
    throw new Error('synthesize() not implemented - CRITICAL for mobile support');
  }

  async getVoices(): Promise<Voice[]> {
    throw new Error('getVoices() not implemented');
  }

  async getVoicePreference(userId: string): Promise<VoicePreference> {
    throw new Error('getVoicePreference() not implemented');
  }

  async updateVoicePreference(userId: string, voiceId: string): Promise<VoicePreference> {
    throw new Error('updateVoicePreference() not implemented');
  }
}

export const speechService = new SpeechService();
