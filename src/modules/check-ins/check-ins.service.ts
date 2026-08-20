import type { DailyCheckIn } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../shared/errors/app-error';
import type { CreateCheckInInput, UpdateCheckInInput } from './check-ins.schema';

interface CreateOrUpdateResult {
  checkIn: DailyCheckIn;
  created: boolean;
}

// Solo puede existir un check-in por usuario/día (@@unique([userId, date])).
// Reenviar el check-in del mismo día es el flujo normal (el atleta corrige
// datos a lo largo del día), así que aquí se actualiza en vez de fallar.
export async function createOrUpdateCheckIn(
  userId: string,
  input: CreateCheckInInput
): Promise<CreateOrUpdateResult> {
  const existing = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId, date: input.date } },
  });

  if (existing) {
    const checkIn = await prisma.dailyCheckIn.update({
      where: { id: existing.id },
      data: input,
    });
    return { checkIn, created: false };
  }

  const checkIn = await prisma.dailyCheckIn.create({ data: { userId, ...input } });
  return { checkIn, created: true };
}

export async function listCheckIns(userId: string): Promise<DailyCheckIn[]> {
  return prisma.dailyCheckIn.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });
}

export async function getCheckInById(userId: string, id: string): Promise<DailyCheckIn> {
  const checkIn = await prisma.dailyCheckIn.findFirst({ where: { id, userId } });

  if (!checkIn) {
    throw new AppError('Check-in no encontrado', 404);
  }

  return checkIn;
}

export async function updateCheckIn(
  userId: string,
  id: string,
  input: UpdateCheckInInput
): Promise<DailyCheckIn> {
  const existing = await getCheckInById(userId, id);

  try {
    return await prisma.dailyCheckIn.update({ where: { id: existing.id }, data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Ya existe un check-in registrado para esa fecha', 409);
    }
    throw err;
  }
}

export async function deleteCheckIn(userId: string, id: string): Promise<void> {
  const existing = await getCheckInById(userId, id);
  await prisma.dailyCheckIn.delete({ where: { id: existing.id } });
}
