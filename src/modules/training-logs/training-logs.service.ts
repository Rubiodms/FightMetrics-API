import type { TrainingLog } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../shared/errors/app-error';
import type { CreateTrainingLogInput, UpdateTrainingLogInput } from './training-logs.schema';

// sRPE (session RPE): carga de la sesión = duración en minutos * percepción de esfuerzo.
// Se calcula siempre en el servidor para que el cliente nunca pueda mandar un valor
// inconsistente; el algoritmo de fatiga (Fase 3) depende de que este dato sea confiable.
function calculateSessionLoad(durationMin: number, rpe: number): number {
  return durationMin * rpe;
}

export async function createTrainingLog(
  userId: string,
  input: CreateTrainingLogInput
): Promise<TrainingLog> {
  return prisma.trainingLog.create({
    data: {
      userId,
      date: input.date,
      type: input.type,
      durationMin: input.durationMin,
      rpe: input.rpe,
      notes: input.notes,
      sessionLoad: calculateSessionLoad(input.durationMin, input.rpe),
    },
  });
}

export async function listTrainingLogs(userId: string): Promise<TrainingLog[]> {
  return prisma.trainingLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });
}

export async function getTrainingLogById(userId: string, id: string): Promise<TrainingLog> {
  const log = await prisma.trainingLog.findFirst({ where: { id, userId } });

  if (!log) {
    throw new AppError('Registro de entrenamiento no encontrado', 404);
  }

  return log;
}

export async function updateTrainingLog(
  userId: string,
  id: string,
  input: UpdateTrainingLogInput
): Promise<TrainingLog> {
  const existing = await getTrainingLogById(userId, id);

  const durationMin = input.durationMin ?? existing.durationMin;
  const rpe = input.rpe ?? existing.rpe;

  return prisma.trainingLog.update({
    where: { id: existing.id },
    data: {
      date: input.date,
      type: input.type,
      durationMin: input.durationMin,
      rpe: input.rpe,
      notes: input.notes,
      sessionLoad: calculateSessionLoad(durationMin, rpe),
    },
  });
}

export async function deleteTrainingLog(userId: string, id: string): Promise<void> {
  const existing = await getTrainingLogById(userId, id);
  await prisma.trainingLog.delete({ where: { id: existing.id } });
}
