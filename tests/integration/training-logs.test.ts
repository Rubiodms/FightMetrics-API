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

describe('CRUD /api/v1/training-logs', () => {
  test('rechaza el acceso sin token con 401', async () => {
    const res = await request(app).get('/api/v1/training-logs');
    expect(res.status).toBe(401);
  });

  test('crea, lista, obtiene, actualiza y elimina un registro de entrenamiento', async () => {
    const token = await registerAndGetToken('atleta@fightmetrics.dev');
    const auth = { Authorization: `Bearer ${token}` };

    const createRes = await request(app)
      .post('/api/v1/training-logs')
      .set(auth)
      .send({ date: '2026-08-10', type: 'GRAPPLING', durationMin: 60, rpe: 8 });

    expect(createRes.status).toBe(201);
    expect(createRes.body.sessionLoad).toBe(480);
    const logId = createRes.body.id;

    const listRes = await request(app).get('/api/v1/training-logs').set(auth);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const getRes = await request(app).get(`/api/v1/training-logs/${logId}`).set(auth);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(logId);

    const updateRes = await request(app)
      .patch(`/api/v1/training-logs/${logId}`)
      .set(auth)
      .send({ durationMin: 90 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.sessionLoad).toBe(720);

    const deleteRes = await request(app).delete(`/api/v1/training-logs/${logId}`).set(auth);
    expect(deleteRes.status).toBe(204);

    const getAfterDeleteRes = await request(app).get(`/api/v1/training-logs/${logId}`).set(auth);
    expect(getAfterDeleteRes.status).toBe(404);
  });

  test('devuelve 400 si el rpe está fuera de rango', async () => {
    const token = await registerAndGetToken('atleta@fightmetrics.dev');

    const res = await request(app)
      .post('/api/v1/training-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-08-10', type: 'GRAPPLING', durationMin: 60, rpe: 15 });

    expect(res.status).toBe(400);
  });

  test('no permite ver registros de entrenamiento de otro usuario', async () => {
    const tokenA = await registerAndGetToken('usera@fightmetrics.dev');
    const tokenB = await registerAndGetToken('userb@fightmetrics.dev');

    const createRes = await request(app)
      .post('/api/v1/training-logs')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ date: '2026-08-10', type: 'GRAPPLING', durationMin: 60, rpe: 8 });

    const res = await request(app)
      .get(`/api/v1/training-logs/${createRes.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});
