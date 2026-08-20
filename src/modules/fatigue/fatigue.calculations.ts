// Motor de cálculo del Índice de Fatiga Aguda. Módulo 100% de funciones puras
// (sin Prisma, sin `new Date()` implícito): la fecha de referencia siempre entra
// como parámetro, así que se testea con Vitest sin tocar la base de datos.
// Ver docs/superpowers/specs/2026-08-20-fatigue-algorithm-design.md para el porqué
// de cada fórmula y umbral.

export type FatigueZone = 'GREEN' | 'YELLOW' | 'RED';
export type Confidence = 'low' | 'full';

export interface DailyLoadInput {
  date: Date;
  sessionLoad: number;
}

export interface CheckInInput {
  date: Date;
  sleepQuality: number;
  energyLevel: number;
  muscleSoreness: number;
  stressLevel: number;
}

export interface FatigueResult {
  acuteLoad: number;
  chronicLoad: number;
  acwr: number | null;
  monotony: number | null;
  strain: number | null;
  recoveryIndex: number | null;
  score: number | null;
  zone: FatigueZone | null;
  recommendation: string;
  confidence: Confidence;
}

const ACUTE_WINDOW_DAYS = 7;
const CHRONIC_WINDOW_DAYS = 28;
const CHECK_IN_FALLBACK_DAYS = 3;

// Normaliza a un identificador de día en UTC (evita que la hora dentro del Date
// afecte el agrupamiento). Limitación conocida y aceptada: no usa el timezone
// del usuario, ver spec.
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((toUtcMidnight(to).getTime() - toUtcMidnight(from).getTime()) / MS_PER_DAY);
}

function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Totales de carga por día calendario dentro de [referenceDate - windowDays + 1, referenceDate].
// Los días sin TrainingLog quedan representados igual, con 0.
function dailyTotalsInWindow(
  loads: DailyLoadInput[],
  referenceDate: Date,
  windowDays: number
): number[] {
  const totalsByDay = new Map<string, number>();
  for (const load of loads) {
    const key = toDateKey(load.date);
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + load.sessionLoad);
  }

  const totals: number[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const day = new Date(referenceDate);
    day.setUTCDate(day.getUTCDate() - i);
    totals.push(totalsByDay.get(toDateKey(day)) ?? 0);
  }
  return totals;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function populationStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

export function calculateAcuteLoad(loads: DailyLoadInput[], referenceDate: Date): number {
  return average(dailyTotalsInWindow(loads, referenceDate, ACUTE_WINDOW_DAYS));
}

export function calculateChronicLoad(loads: DailyLoadInput[], referenceDate: Date): number {
  return average(dailyTotalsInWindow(loads, referenceDate, CHRONIC_WINDOW_DAYS));
}

export function calculateAcwr(acuteLoad: number, chronicLoad: number): number | null {
  if (chronicLoad === 0) return null;
  return acuteLoad / chronicLoad;
}

export function calculateMonotony(loads: DailyLoadInput[], referenceDate: Date): number | null {
  const dailyTotals = dailyTotalsInWindow(loads, referenceDate, ACUTE_WINDOW_DAYS);
  const stdDev = populationStdDev(dailyTotals);
  if (stdDev === 0) return null;
  return average(dailyTotals) / stdDev;
}

export function calculateStrain(
  loads: DailyLoadInput[],
  referenceDate: Date,
  monotony: number | null
): number | null {
  if (monotony === null) return null;
  const weeklyTotal = dailyTotalsInWindow(loads, referenceDate, ACUTE_WINDOW_DAYS).reduce(
    (sum, v) => sum + v,
    0
  );
  return weeklyTotal * monotony;
}

export function calculateRecoveryIndex(checkIn: CheckInInput | null): number | null {
  if (!checkIn) return null;
  const avg =
    (checkIn.sleepQuality +
      checkIn.energyLevel +
      (10 - checkIn.muscleSoreness) +
      (10 - checkIn.stressLevel)) /
    4;
  return avg * 10;
}

export function selectRecoveryCheckIn(
  checkIns: CheckInInput[],
  referenceDate: Date
): CheckInInput | null {
  const todayKey = toDateKey(referenceDate);
  const today = checkIns.find((c) => toDateKey(c.date) === todayKey);
  if (today) return today;

  const withinFallback = checkIns
    .filter((c) => {
      const diff = daysBetween(c.date, referenceDate);
      return diff > 0 && diff <= CHECK_IN_FALLBACK_DAYS;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return withinFallback[0] ?? null;
}

export function zoneFromAcwr(acwr: number | null): FatigueZone | null {
  if (acwr === null) return null;
  if (acwr < 0.8) return 'YELLOW';
  if (acwr <= 1.3) return 'GREEN';
  if (acwr <= 1.5) return 'YELLOW';
  return 'RED';
}

export function zoneFromRecovery(recoveryIndex: number | null): FatigueZone | null {
  if (recoveryIndex === null) return null;
  if (recoveryIndex >= 70) return 'GREEN';
  if (recoveryIndex >= 40) return 'YELLOW';
  return 'RED';
}

const ZONE_SEVERITY: Record<FatigueZone, number> = { GREEN: 0, YELLOW: 1, RED: 2 };

export function combineZones(a: FatigueZone | null, b: FatigueZone | null): FatigueZone | null {
  if (a === null) return b;
  if (b === null) return a;
  return ZONE_SEVERITY[a] >= ZONE_SEVERITY[b] ? a : b;
}

const ACWR_SUB_SCORE: Record<FatigueZone, number> = { GREEN: 100, YELLOW: 60, RED: 20 };

function acwrSubScoreFromZone(zone: FatigueZone | null): number | null {
  if (zone === null) return null;
  return ACWR_SUB_SCORE[zone];
}

export function calculateScore(
  acwrSubScore: number | null,
  recoveryIndex: number | null
): number | null {
  if (acwrSubScore === null) return recoveryIndex;
  if (recoveryIndex === null) return acwrSubScore;
  return Math.min(acwrSubScore, recoveryIndex);
}

const RECOMMENDATIONS: Record<FatigueZone | 'NONE', string> = {
  NONE: 'Sin datos suficientes todavía para calcular tu fatiga. Registra entrenamientos y check-ins para empezar a ver resultados.',
  GREEN: 'Carga y recuperación en buen equilibrio. Puedes mantener tu plan de entrenamiento.',
  YELLOW:
    'Atención: hay señales de desbalance en carga o recuperación. Considera ajustar la intensidad o priorizar el descanso hoy.',
  RED: 'Carga o recuperación en zona de riesgo. Prioriza descanso activo y recuperación antes de la próxima sesión de alta intensidad.',
};

export function buildRecommendation(zone: FatigueZone | null): string {
  return RECOMMENDATIONS[zone ?? 'NONE'];
}

export function determineConfidence(loads: DailyLoadInput[], referenceDate: Date): Confidence {
  if (loads.length === 0) return 'low';
  const earliest = loads.reduce(
    (min, l) => (l.date.getTime() < min.getTime() ? l.date : min),
    loads[0].date
  );
  const spanDays = daysBetween(earliest, referenceDate) + 1;
  return spanDays >= CHRONIC_WINDOW_DAYS ? 'full' : 'low';
}

interface CalculateFatigueInput {
  referenceDate: Date;
  trainingLoads: DailyLoadInput[];
  checkIns: CheckInInput[];
}

export function calculateFatigue(input: CalculateFatigueInput): FatigueResult {
  const { referenceDate, trainingLoads, checkIns } = input;

  const acuteLoad = calculateAcuteLoad(trainingLoads, referenceDate);
  const chronicLoad = calculateChronicLoad(trainingLoads, referenceDate);
  const acwr = calculateAcwr(acuteLoad, chronicLoad);
  const monotony = calculateMonotony(trainingLoads, referenceDate);
  const strain = calculateStrain(trainingLoads, referenceDate, monotony);

  const selectedCheckIn = selectRecoveryCheckIn(checkIns, referenceDate);
  const recoveryIndex = calculateRecoveryIndex(selectedCheckIn);

  const zoneAcwr = zoneFromAcwr(acwr);
  const zoneRecovery = zoneFromRecovery(recoveryIndex);
  const zone = combineZones(zoneAcwr, zoneRecovery);

  const score = calculateScore(acwrSubScoreFromZone(zoneAcwr), recoveryIndex);
  const recommendation = buildRecommendation(zone);
  const confidence = determineConfidence(trainingLoads, referenceDate);

  return {
    acuteLoad,
    chronicLoad,
    acwr,
    monotony,
    strain,
    recoveryIndex,
    score,
    zone,
    recommendation,
    confidence,
  };
}
