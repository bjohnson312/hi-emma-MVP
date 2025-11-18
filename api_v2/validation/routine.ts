import { z } from 'zod';

export const startRoutineSchema = z.object({
  type: z.enum(['morning', 'evening']),
  templateId: z.string().optional(),
  customActivities: z.array(z.string()).optional(),
});

export const nextStepSchema = z.object({
  sessionId: z.string().uuid(),
  response: z.object({
    type: z.string(),
    value: z.any(),
    timestamp: z.string().optional(),
  }),
});

export const routinePreferencesSchema = z.object({
  morningTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  eveningTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  templateId: z.string().optional(),
  customActivities: z.array(z.string()).optional(),
  reminderEnabled: z.boolean(),
  reminderTime: z.number().min(0).max(60).optional(),
});
