import { beforeEach, describe, expect, test } from 'vitest';
import { getUserProfile } from '@/modules/users/users.service';
import { registerUser } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { resetDb } from '../../../setup/reset-db';

beforeEach(async () => {
  await resetDb();
});

describe('getUserProfile', () => {
  test('devuelve el perfil del usuario sin passwordHash', async () => {
    const { user } = await registerUser({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    const profile = await getUserProfile(user.id);

    expect(profile.email).toBe('atleta@fightmetrics.dev');
    expect(profile).not.toHaveProperty('passwordHash');
  });

  test('lanza AppError 404 si el usuario no existe', async () => {
    await expect(getUserProfile('id-inexistente')).rejects.toMatchObject<Partial<AppError>>({
      statusCode: 404,
    });
  });
});
