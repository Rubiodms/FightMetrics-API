import type { FatigueScore } from '@prisma/client';
import { prisma } from '../../config/db';
import {
  calculateFatigue,
  type CheckInInput,
  type Confidence,
  type DailyLoadInput,
} from './fatigue.calculations';

const CHRONIC_WINDOW_DAYS = 28;
const CHECK_IN_FALLBACK_DAYS = 3;

export interface TodayFatigueResult extends FatigueScore {
  confidence: Confidence;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export async function getTodayFatigue(
  userId: string,
  referenceDate: Date = new Date()
): Promise<TodayFatigueResult> {
  const todayKey = startOfUtcDay(referenceDate);
  const chronicWindowStart = startOfUtcDay(subDays(referenceDate, CHRONIC_WINDOW_DAYS - 1));
  const checkInWindowStart = startOfUtcDay(subDays(referenceDate, CHECK_IN_FALLBACK_DAYS));
  const windowEnd = endOfUtcDay(referenceDate);

  // Dos consultas independientes, en paralelo, cada una apoyada en el índice
  // compuesto [userId, date] que ya existe en el schema desde la Fase 1.
  const [trainingLogs, checkIns] = await Promise.all([
    prisma.trainingLog.findMany({
      where: { userId, date: { gte: chronicWindowStart, lte: windowEnd } },
      select: { date: true, sessionLoad: true },
    }),
    prisma.dailyCheckIn.findMany({
      where: { userId, date: { gte: checkInWindowStart, lte: windowEnd } },
      select: { date: true, sleepQuality: true, energyLevel: true, muscleSoreness: true, stressLevel: true },
    }),
  ]);

  const trainingLoadInputs: DailyLoadInput[] = trainingLogs.map((log) => ({
    date: log.date,
    sessionLoad: log.sessionLoad,
  }));
  const checkInInputs: CheckInInput[] = checkIns.map((checkIn) => ({
    date: checkIn.date,
    sleepQuality: checkIn.sleepQuality,
    energyLevel: checkIn.energyLevel,
    muscleSoreness: checkIn.muscleSoreness,
    stressLevel: checkIn.stressLevel,
  }));

  const result = calculateFatigue({
    referenceDate,
    trainingLoads: trainingLoadInputs,
    checkIns: checkInInputs,
  });

  // confidence es metadata sobre qué tan completo está el cálculo, no un hecho
  // persistible del día — se recalcula en cada request y no vive en la tabla.
  const { confidence, ...persistable } = result;

  const fatigueScore = await prisma.fatigueScore.upsert({
    where: { userId_date: { userId, date: todayKey } },
    update: { ...persistable, computedAt: new Date() },
    create: { userId, date: todayKey, ...persistable },
  });

  return { ...fatigueScore, confidence };
}
