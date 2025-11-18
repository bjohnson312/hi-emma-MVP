import { z } from 'zod';

export const completeStepSchema = z.object({
  data: z.record(z.any()),
});

export const updateStepSchema = z.object({
  data: z.record(z.any()),
});
