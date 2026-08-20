import { z } from 'zod';

export const createCheckInSchema = z.object({
  date: z.coerce.date(),
  sleepHours: z.number().min(0, 'sleepHours no puede ser negativo').max(24),
  sleepQuality: z.number().int().min(1).max(10),
  muscleSoreness: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  stressLevel: z.number().int().min(1).max(10),
  bodyweightKg: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const updateCheckInSchema = createCheckInSchema.partial();

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
export type UpdateCheckInInput = z.infer<typeof updateCheckInSchema>;
