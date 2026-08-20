import { beforeEach, describe, expect, test } from 'vitest';
import { loginUser, registerUser } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { verifyToken } from '@/shared/utils/jwt';
import { resetDb } from '../../../setup/reset-db';

beforeEach(async () => {
  await resetDb();
});

describe('registerUser', () => {
  test('crea un usuario nuevo y devuelve un token válido', async () => {
    const result = await registerUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    expect(result.user.email).toBe('atleta@fightmetrics.dev');
    expect(result.user.name).toBe('Atleta de Prueba');

    const decoded = verifyToken(result.token);
    expect(decoded.sub).toBe(result.user.id);
  });

  test('nunca devuelve el passwordHash en el usuario', async () => {
    const result = await registerUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    expect(result.user).not.toHaveProperty('passwordHash');
  });

  test('lanza AppError 409 si el email ya está registrado', async () => {
    await registerUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    await expect(
      registerUser({
        email: 'atleta@fightmetrics.dev',
        password: 'OtraPass123',
        name: 'Otro Atleta',
      })
    ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 409 });
  });
});

describe('loginUser', () => {
  test('devuelve un token válido con credenciales correctas', async () => {
    await registerUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    const result = await loginUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
    });

    const decoded = verifyToken(result.token);
    expect(decoded.email).toBe('atleta@fightmetrics.dev');
  });

  test('lanza AppError 401 si el email no existe', async () => {
    await expect(
      loginUser({ email: 'no-existe@fightmetrics.dev', password: 'P@ssword123' })
    ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 401 });
  });

  test('lanza AppError 401 si la contraseña es incorrecta', async () => {
    await registerUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    await expect(
      loginUser({ email: 'atleta@fightmetrics.dev', password: 'incorrecta' })
    ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 401 });
  });
});
