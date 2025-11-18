import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  sessionId: z.string().uuid().optional(),
  type: z.enum(['general', 'morning', 'evening', 'nutrition', 'mood']).optional(),
});

export const endSessionSchema = z.object({
  generateSummary: z.boolean().optional(),
});
