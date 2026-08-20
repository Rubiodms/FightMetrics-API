import { beforeEach, describe, expect, test } from 'vitest';
import { TrainingType } from '@prisma/client';
import {
  createTrainingLog,
  deleteTrainingLog,
  getTrainingLogById,
  listTrainingLogs,
  updateTrainingLog,
} from '@/modules/training-logs/training-logs.service';
import { registerUser } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { resetDb } from '../../../setup/reset-db';

let userAId: string;
let userBId: string;

beforeEach(async () => {
  await resetDb();
  const userA = await registerUser({
    email: 'usera@fightmetrics.dev',
    password: 'P@ssword123',
    name: 'Usuario A',
  });
  const userB = await registerUser({
    email: 'userb@fightmetrics.dev',
    password: 'P@ssword123',
    name: 'Usuario B',
  });
  userAId = userA.user.id;
  userBId = userB.user.id;
});

describe('createTrainingLog', () => {
  test('crea el registro y calcula sessionLoad = durationMin * rpe', async () => {
    const log = await createTrainingLog(userAId, {
      date: new Date('2026-08-10'),
      type: TrainingType.GRAPPLING,
      durationMin: 60,
      rpe: 8,
    });

    expect(log.sessionLoad).toBe(480);
    expect(log.userId).toBe(userAId);
  });
});

describe('listTrainingLogs', () => {
  test('devuelve solo los registros del usuario solicitante', async () => {
    await createTrainingLog(userAId, {
      date: new Date('2026-08-10'),
      type: TrainingType.STRIKING,
      durationMin: 45,
      rpe: 6,
    });
    await createTrainingLog(userBId, {
      date: new Date('2026-08-11'),
      type: TrainingType.STRENGTH,
      durationMin: 50,
      rpe: 7,
    });

    const logs = await listTrainingLogs(userAId);

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe(userAId);
  });

  test('ordena los registros por fecha descendente', async () => {
    await createTrainingLog(userAId, {
      date: new Date('2026-08-01'),
      type: TrainingType.MOBILITY,
      durationMin: 30,
      rpe: 3,
    });
    await createTrainingLog(userAId, {
      date: new Date('2026-08-15'),
      type: TrainingType.POWER,
      durationMin: 40,
      rpe: 8,
    });

    const logs = await listTrainingLogs(userAId);

    expect(logs[0].date.toISOString()).toContain('2026-08-15');
    expect(logs[1].date.toISOString()).toContain('2026-08-01');
  });
});

describe('getTrainingLogById', () => {
  test('devuelve el registro si pertenece al usuario', async () => {
    const created = await createTrainingLog(userAId, {
      date: new Date('2026-08-10'),
      type: TrainingType.CONDITIONING,
      durationMin: 40,
      rpe: 9,
    });

    const log = await getTrainingLogById(userAId, created.id);

    expect(log.id).toBe(created.id);
  });

  test('lanza AppError 404 si el registro no existe', async () => {
    await expect(getTrainingLogById(userAId, 'id-inexistente')).rejects.toMatchObject<
      Partial<AppError>
    >({ statusCode: 404 });
  });

  test('lanza AppError 404 si el registro pertenece a otro usuario', async () => {
    const created = await createTrainingLog(userBId, {
      date: new Date('2026-08-10'),
      type: TrainingType.CONDITIONING,
      durationMin: 40,
      rpe: 9,
    });

    await expect(getTrainingLogById(userAId, created.id)).rejects.toMatchObject<Partial<AppError>>(
      { statusCode: 404 }
    );
  });
});

describe('updateTrainingLog', () => {
  test('actualiza campos y recalcula sessionLoad si cambian duration/rpe', async () => {
    const created = await createTrainingLog(userAId, {
      date: new Date('2026-08-10'),
      type: TrainingType.GRAPPLING,
      durationMin: 60,
      rpe: 8,
    });

    const updated = await updateTrainingLog(userAId, created.id, { durationMin: 90, rpe: 9 });

    expect(updated.sessionLoad).toBe(810);
  });

  test('lanza AppError 404 si el registro pertenece a otro usuario', async () => {
    const created = await createTrainingLog(userBId, {
      date: new Date('2026-08-10'),
      type: TrainingType.GRAPPLING,
      durationMin: 60,
      rpe: 8,
    });

    await expect(
      updateTrainingLog(userAId, created.id, { durationMin: 30 })
    ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 404 });
  });
});

describe('deleteTrainingLog', () => {
  test('elimina el registro del usuario', async () => {
    const created = await createTrainingLog(userAId, {
      date: new Date('2026-08-10'),
      type: TrainingType.GRAPPLING,
      durationMin: 60,
      rpe: 8,
    });

    await deleteTrainingLog(userAId, created.id);

    await expect(getTrainingLogById(userAId, created.id)).rejects.toMatchObject<Partial<AppError>>(
      { statusCode: 404 }
    );
  });

  test('lanza AppError 404 si el registro pertenece a otro usuario', async () => {
    const created = await createTrainingLog(userBId, {
      date: new Date('2026-08-10'),
      type: TrainingType.GRAPPLING,
      durationMin: 60,
      rpe: 8,
    });

    await expect(deleteTrainingLog(userAId, created.id)).rejects.toMatchObject<Partial<AppError>>({
      statusCode: 404,
    });
  });
});
