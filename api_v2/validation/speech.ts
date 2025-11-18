import { z } from 'zod';

export const transcribeSchema = z.object({
  audioData: z.string().min(1, 'Audio data is required'),
  format: z.enum(['wav', 'mp3', 'ogg', 'webm']),
  language: z.string().optional(),
});

export const synthesizeSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text too long'),
  voiceId: z.string().min(1, 'Voice ID is required'),
  speed: z.number().min(0.5).max(2.0).optional(),
  format: z.enum(['mp3', 'wav']).optional(),
});
