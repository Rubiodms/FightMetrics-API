import { TrainingType } from '@prisma/client';
import { z } from 'zod';

export const createTrainingLogSchema = z.object({
  date: z.coerce.date(),
  type: z.nativeEnum(TrainingType),
  durationMin: z.number().int().positive(),
  rpe: z.number().int().min(1, 'El RPE mínimo es 1').max(10, 'El RPE máximo es 10'),
  notes: z.string().optional(),
});

export const updateTrainingLogSchema = createTrainingLogSchema.partial();

export type CreateTrainingLogInput = z.infer<typeof createTrainingLogSchema>;
export type UpdateTrainingLogInput = z.infer<typeof updateTrainingLogSchema>;
