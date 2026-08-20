import { beforeEach, describe, expect, test } from 'vitest';
import request from 'supertest';
import { TrainingType } from '@prisma/client';
import { app } from '@/app';
import { prisma } from '@/config/db';
import { registerUser } from '@/modules/auth/auth.service';
import { createTrainingLog } from '@/modules/training-logs/training-logs.service';
import { createOrUpdateCheckIn } from '@/modules/check-ins/check-ins.service';
import { resetDb } from '../setup/reset-db';

beforeEach(async () => {
  await resetDb();
});

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function registerAndGetUser() {
  const { user, token } = await registerUser({
    email: 'atleta@fightmetrics.dev',
    password: 'P@ssword123',
    name: 'Atleta de Prueba',
  });
  return { userId: user.id, auth: { Authorization: `Bearer ${token}` } };
}

describe('GET /api/v1/fatigue/today', () => {
  test('rechaza el acceso sin token con 401', async () => {
    const res = await request(app).get('/api/v1/fatigue/today');
    expect(res.status).toBe(401);
  });

  test('sin ningún dato: 200 con todo en null y confidence "low", sin explotar', async () => {
    const { auth } = await registerAndGetUser();

    const res = await request(app).get('/api/v1/fatigue/today').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.acwr).toBeNull();
    expect(res.body.zone).toBeNull();
    expect(res.body.confidence).toBe('low');
    expect(typeof res.body.recommendation).toBe('string');
    expect(res.body.recommendation.length).toBeGreaterThan(0);
  });

  test('con 28 días de carga estable y buena recuperación: zone GREEN y confidence "full"', async () => {
    const { userId, auth } = await registerAndGetUser();

    for (let i = 0; i < 28; i++) {
      await createTrainingLog(userId, {
        date: daysAgo(i),
        type: TrainingType.GRAPPLING,
        durationMin: 60,
        rpe: 5,
      });
    }
    await createOrUpdateCheckIn(userId, {
      date: daysAgo(0),
      sleepHours: 8,
      sleepQuality: 8,
      muscleSoreness: 2,
      energyLevel: 8,
      stressLevel: 2,
    });

    const res = await request(app).get('/api/v1/fatigue/today').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.zone).toBe('GREEN');
    expect(res.body.confidence).toBe('full');
    expect(res.body.score).toBeGreaterThan(0);
  });

  test('con poco historial (menos de 28 días): confidence "low" aunque haya datos', async () => {
    const { userId, auth } = await registerAndGetUser();

    await createTrainingLog(userId, {
      date: daysAgo(0),
      type: TrainingType.STRIKING,
      durationMin: 45,
      rpe: 6,
    });

    const res = await request(app).get('/api/v1/fatigue/today').set(auth);

    expect(res.status).toBe(200);
    expect(res.body.confidence).toBe('low');
  });

  test('persiste el resultado en FatigueScore (upsert, no duplica filas en el mismo día)', async () => {
    const { userId, auth } = await registerAndGetUser();

    await createTrainingLog(userId, {
      date: daysAgo(0),
      type: TrainingType.STRIKING,
      durationMin: 45,
      rpe: 6,
    });

    const firstRes = await request(app).get('/api/v1/fatigue/today').set(auth);
    const secondRes = await request(app).get('/api/v1/fatigue/today').set(auth);

    expect(firstRes.body.id).toBe(secondRes.body.id);

    const rows = await prisma.fatigueScore.findMany({ where: { userId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(firstRes.body.id);
  });

  test('no expone datos de fatiga de otro usuario', async () => {
    const userA = await registerAndGetUser();
    await createTrainingLog(userA.userId, {
      date: daysAgo(0),
      type: TrainingType.STRIKING,
      durationMin: 45,
      rpe: 6,
    });
    await request(app).get('/api/v1/fatigue/today').set(userA.auth);

    const { user: userB, token: tokenB } = await registerUser({
      email: 'otro@fightmetrics.dev',
      password: 'P@ssword123',
      name: 'Otro Atleta',
    });

    const res = await request(app)
      .get('/api/v1/fatigue/today')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.zone).toBeNull(); // usuario B no tiene datos propios

    const rows = await prisma.fatigueScore.findMany({ where: { userId: userB.id } });
    expect(rows).toHaveLength(1);
  });
});
