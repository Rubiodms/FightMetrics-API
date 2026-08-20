import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { resetDb } from '../setup/reset-db';

beforeEach(async () => {
  await resetDb();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'atleta@fightmetrics.dev',
    password: 'P@ssword123',
    name: 'Atleta de Prueba',
  });
  return res.body.token as string;
}

describe('GET /api/v1/users/me', () => {
  test('devuelve el perfil del usuario autenticado', async () => {
    const token = await registerAndGetToken();

    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('atleta@fightmetrics.dev');
    expect(res.body.passwordHash).toBeUndefined();
  });

  test('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
  });
});
