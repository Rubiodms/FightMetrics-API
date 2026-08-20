import { describe, expect, test } from 'vitest';
import { loginBodySchema, registerBodySchema } from '@/modules/auth/auth.schema';

describe('registerBodySchema', () => {
  test('acepta un payload válido con campos opcionales', () => {
    const result = registerBodySchema.safeParse({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
      bodyweightKg: 77.5,
      sport: 'MMA',
    });

    expect(result.success).toBe(true);
  });

  test('acepta un payload válido sin los campos opcionales', () => {
    const result = registerBodySchema.safeParse({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    expect(result.success).toBe(true);
  });

  test('rechaza un email inválido', () => {
    const result = registerBodySchema.safeParse({
      email: 'no-es-un-email',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    expect(result.success).toBe(false);
  });

  test('rechaza una contraseña de menos de 8 caracteres', () => {
    const result = registerBodySchema.safeParse({
      email: 'atleta@fightmetrics.dev',
      password: '1234567',
      name: 'Atleta de Prueba',
    });

    expect(result.success).toBe(false);
  });

  test('rechaza un sport que no existe en el enum', () => {
    const result = registerBodySchema.safeParse({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
      sport: 'KARATE',
    });

    expect(result.success).toBe(false);
  });
});

describe('loginBodySchema', () => {
  test('acepta un payload válido', () => {
    const result = loginBodySchema.safeParse({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
    });

    expect(result.success).toBe(true);
  });

  test('rechaza si falta la contraseña', () => {
    const result = loginBodySchema.safeParse({
      email: 'atleta@fightmetrics.dev',
    });

    expect(result.success).toBe(false);
  });
});
