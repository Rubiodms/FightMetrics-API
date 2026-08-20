import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { resetDb } from '../setup/reset-db';

beforeEach(async () => {
  await resetDb();
});

async function registerAndGetToken(email: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/register').send({
    email,
    password: 'P@ssword123',
    name: 'Atleta de Prueba',
  });
  return res.body.token as string;
}

const validBody = {
  date: '2026-08-10',
  sleepHours: 7,
  sleepQuality: 7,
  muscleSoreness: 3,
  energyLevel: 7,
  stressLevel: 4,
};

describe('CRUD /api/v1/check-ins', () => {
  test('rechaza el acceso sin token con 401', async () => {
    const res = await request(app).get('/api/v1/check-ins');
    expect(res.status).toBe(401);
  });

  test('crea (201) y al reenviar el mismo día actualiza (200) en vez de duplicar', async () => {
    const token = await registerAndGetToken('atleta@fightmetrics.dev');
    const auth = { Authorization: `Bearer ${token}` };

    const createRes = await request(app).post('/api/v1/check-ins').set(auth).send(validBody);
    expect(createRes.status).toBe(201);

    const resendRes = await request(app)
      .post('/api/v1/check-ins')
      .set(auth)
      .send({ ...validBody, sleepHours: 5 });
    expect(resendRes.status).toBe(200);
    expect(resendRes.body.id).toBe(createRes.body.id);
    expect(resendRes.body.sleepHours).toBe(5);

    const listRes = await request(app).get('/api/v1/check-ins').set(auth);
    expect(listRes.body).toHaveLength(1);
  });

  test('obtiene, actualiza y elimina un check-in por id', async () => {
    const token = await registerAndGetToken('atleta@fightmetrics.dev');
    const auth = { Authorization: `Bearer ${token}` };

    const createRes = await request(app).post('/api/v1/check-ins').set(auth).send(validBody);
    const id = createRes.body.id;

    const getRes = await request(app).get(`/api/v1/check-ins/${id}`).set(auth);
    expect(getRes.status).toBe(200);

    const updateRes = await request(app)
      .patch(`/api/v1/check-ins/${id}`)
      .set(auth)
      .send({ energyLevel: 9 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.energyLevel).toBe(9);

    const deleteRes = await request(app).delete(`/api/v1/check-ins/${id}`).set(auth);
    expect(deleteRes.status).toBe(204);

    const getAfterDeleteRes = await request(app).get(`/api/v1/check-ins/${id}`).set(auth);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  test('devuelve 400 si sleepQuality está fuera de rango', async () => {
    const token = await registerAndGetToken('atleta@fightmetrics.dev');

    const res = await request(app)
      .post('/api/v1/check-ins')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBody, sleepQuality: 99 });

    expect(res.status).toBe(400);
  });

  test('no permite ver check-ins de otro usuario', async () => {
    const tokenA = await registerAndGetToken('usera@fightmetrics.dev');
    const tokenB = await registerAndGetToken('userb@fightmetrics.dev');

    const createRes = await request(app)
      .post('/api/v1/check-ins')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validBody);

    const res = await request(app)
      .get(`/api/v1/check-ins/${createRes.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});
