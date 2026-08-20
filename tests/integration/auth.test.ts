import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { resetDb } from '../setup/reset-db';

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/v1/auth/register', () => {
  test('registra un usuario nuevo y devuelve token + usuario sin passwordHash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('atleta@fightmetrics.dev');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('devuelve 409 si el email ya está registrado', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'atleta@fightmetrics.dev',
      password: 'OtraPass123',
      name: 'Otro Atleta',
    });

    expect(res.status).toBe(409);
  });

  test('devuelve 400 si falta la contraseña', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'atleta@fightmetrics.dev',
      name: 'Atleta de Prueba',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  test('devuelve token con credenciales correctas', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Atleta de Prueba',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'atleta@fightmetrics.dev',
      password: 'P@ssword123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('devuelve 401 con credenciales incorrectas', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'no-existe@fightmetrics.dev',
      password: 'P@ssword123',
    });

    expect(res.status).toBe(401);
  });
});
