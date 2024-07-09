import { z } from 'zod';

export const watchHistorySchema = z.object({
  progress: z.number().min(0),
});

export const watchHistoryIdSchema = z.number().positive().int();
