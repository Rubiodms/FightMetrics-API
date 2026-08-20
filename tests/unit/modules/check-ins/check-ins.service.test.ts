import { beforeEach, describe, expect, test } from 'vitest';
import {
  createOrUpdateCheckIn,
  deleteCheckIn,
  getCheckInById,
  listCheckIns,
  updateCheckIn,
} from '@/modules/check-ins/check-ins.service';
import { registerUser } from '@/modules/auth/auth.service';
import { AppError } from '@/shared/errors/app-error';
import { resetDb } from '../../../setup/reset-db';

let userAId: string;
let userBId: string;

const baseInput = {
  date: new Date('2026-08-10'),
  sleepHours: 7,
  sleepQuality: 7,
  muscleSoreness: 3,
  energyLevel: 7,
  stressLevel: 4,
};

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

describe('createOrUpdateCheckIn', () => {
  test('crea un check-in nuevo cuando no hay uno previo para esa fecha', async () => {
    const { checkIn, created } = await createOrUpdateCheckIn(userAId, baseInput);

    expect(created).toBe(true);
    expect(checkIn.userId).toBe(userAId);
    expect(checkIn.sleepHours).toBe(7);
  });

  test('actualiza el check-in existente si ya hay uno para la misma fecha', async () => {
    const first = await createOrUpdateCheckIn(userAId, baseInput);

    const second = await createOrUpdateCheckIn(userAId, { ...baseInput, sleepHours: 5 });

    expect(second.created).toBe(false);
    expect(second.checkIn.id).toBe(first.checkIn.id);
    expect(second.checkIn.sleepHours).toBe(5);
  });
});

describe('listCheckIns', () => {
  test('devuelve solo los check-ins del usuario solicitante', async () => {
    await createOrUpdateCheckIn(userAId, baseInput);
    await createOrUpdateCheckIn(userBId, { ...baseInput, date: new Date('2026-08-11') });

    const checkIns = await listCheckIns(userAId);

    expect(checkIns).toHaveLength(1);
    expect(checkIns[0].userId).toBe(userAId);
  });
});

describe('getCheckInById', () => {
  test('lanza AppError 404 si el check-in pertenece a otro usuario', async () => {
    const { checkIn } = await createOrUpdateCheckIn(userBId, baseInput);

    await expect(getCheckInById(userAId, checkIn.id)).rejects.toMatchObject<Partial<AppError>>({
      statusCode: 404,
    });
  });
});

describe('updateCheckIn', () => {
  test('actualiza campos por id', async () => {
    const { checkIn } = await createOrUpdateCheckIn(userAId, baseInput);

    const updated = await updateCheckIn(userAId, checkIn.id, { energyLevel: 9 });

    expect(updated.energyLevel).toBe(9);
  });

  test('lanza AppError 409 si la nueva fecha ya tiene otro check-in del mismo usuario', async () => {
    await createOrUpdateCheckIn(userAId, baseInput);
    const { checkIn: second } = await createOrUpdateCheckIn(userAId, {
      ...baseInput,
      date: new Date('2026-08-11'),
    });

    await expect(
      updateCheckIn(userAId, second.id, { date: baseInput.date })
    ).rejects.toMatchObject<Partial<AppError>>({ statusCode: 409 });
  });
});

describe('deleteCheckIn', () => {
  test('elimina el check-in y luego no se puede volver a obtener', async () => {
    const { checkIn } = await createOrUpdateCheckIn(userAId, baseInput);

    await deleteCheckIn(userAId, checkIn.id);

    await expect(getCheckInById(userAId, checkIn.id)).rejects.toMatchObject<Partial<AppError>>({
      statusCode: 404,
    });
  });

  test('lanza AppError 404 si el check-in pertenece a otro usuario', async () => {
    const { checkIn } = await createOrUpdateCheckIn(userBId, baseInput);

    await expect(deleteCheckIn(userAId, checkIn.id)).rejects.toMatchObject<Partial<AppError>>({
      statusCode: 404,
    });
  });
});
