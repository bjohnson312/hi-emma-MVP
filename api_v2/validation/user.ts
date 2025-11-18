import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  voiceId: z.string().optional(),
  notificationChannels: z.array(z.enum(['push', 'sms', 'email'])).optional(),
  morningRoutineTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eveningRoutineTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});
