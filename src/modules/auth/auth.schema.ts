import { Sport } from '@prisma/client';
import { z } from 'zod';

export const registerBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  bodyweightKg: z.number().positive().optional(),
  sport: z.nativeEnum(Sport).optional(),
});

export const loginBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
