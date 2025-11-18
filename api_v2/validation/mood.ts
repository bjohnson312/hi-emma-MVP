import { z } from 'zod';

export const logMoodSchema = z.object({
  mood: z.number().min(1, 'Mood must be at least 1').max(10, 'Mood must be at most 10'),
  intensity: z.number().min(1).max(5).optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  triggers: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
});

export const moodHistoryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const moodTrendsQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional(),
});
