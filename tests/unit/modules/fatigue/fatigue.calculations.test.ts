import { describe, expect, test } from 'vitest';
import {
  calculateAcuteLoad,
  calculateAcwr,
  calculateChronicLoad,
  calculateFatigue,
  calculateMonotony,
  calculateRecoveryIndex,
  calculateScore,
  calculateStrain,
  combineZones,
  determineConfidence,
  selectRecoveryCheckIn,
  zoneFromAcwr,
  zoneFromRecovery,
  type CheckInInput,
  type DailyLoadInput,
} from '@/modules/fatigue/fatigue.calculations';

const REF = new Date('2026-08-20');

function daysAgo(n: number): Date {
  const d = new Date(REF);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

describe('calculateAcuteLoad', () => {
  test('promedia la carga diaria de los últimos 7 días (incluye hoy)', () => {
    const loads: DailyLoadInput[] = [
      { date: daysAgo(0), sessionLoad: 700 },
      { date: daysAgo(6), sessionLoad: 700 },
    ];

    // (700 + 0 + 0 + 0 + 0 + 0 + 700) / 7
    expect(calculateAcuteLoad(loads, REF)).toBeCloseTo(200);
  });

  test('ignora logs fuera de la ventana de 7 días', () => {
    const loads: DailyLoadInput[] = [{ date: daysAgo(10), sessionLoad: 1000 }];

    expect(calculateAcuteLoad(loads, REF)).toBe(0);
  });

  test('suma varios registros del mismo día antes de promediar', () => {
    const loads: DailyLoadInput[] = [
      { date: daysAgo(0), sessionLoad: 300 },
      { date: daysAgo(0), sessionLoad: 400 },
    ];

    expect(calculateAcuteLoad(loads, REF)).toBeCloseTo(100); // 700 / 7
  });

  test('devuelve 0 sin ningún registro', () => {
    expect(calculateAcuteLoad([], REF)).toBe(0);
  });
});

describe('calculateChronicLoad', () => {
  test('promedia la carga diaria de los últimos 28 días', () => {
    const loads: DailyLoadInput[] = [{ date: daysAgo(0), sessionLoad: 2800 }];

    expect(calculateChronicLoad(loads, REF)).toBeCloseTo(100); // 2800 / 28
  });

  test('ignora logs fuera de la ventana de 28 días', () => {
    const loads: DailyLoadInput[] = [{ date: daysAgo(29), sessionLoad: 5000 }];

    expect(calculateChronicLoad(loads, REF)).toBe(0);
  });
});

describe('calculateAcwr', () => {
  test('divide carga aguda entre carga crónica', () => {
    expect(calculateAcwr(120, 100)).toBeCloseTo(1.2);
  });

  test('devuelve null si la carga crónica es 0 (evita división por cero)', () => {
    expect(calculateAcwr(50, 0)).toBeNull();
  });
});

describe('calculateMonotony', () => {
  test('media / desviación estándar de los últimos 7 días', () => {
    const loads: DailyLoadInput[] = [
      { date: daysAgo(0), sessionLoad: 100 },
      { date: daysAgo(1), sessionLoad: 200 },
      { date: daysAgo(2), sessionLoad: 300 },
    ];

    const monotony = calculateMonotony(loads, REF);
    expect(monotony).not.toBeNull();
    expect(monotony).toBeGreaterThan(0);
  });

  test('devuelve null si la desviación estándar es 0 (misma carga todos los días)', () => {
    const loads: DailyLoadInput[] = Array.from({ length: 7 }, (_, i) => ({
      date: daysAgo(i),
      sessionLoad: 200,
    }));

    expect(calculateMonotony(loads, REF)).toBeNull();
  });

  test('devuelve null si no hay ninguna carga en la semana (todo 0)', () => {
    expect(calculateMonotony([], REF)).toBeNull();
  });
});

describe('calculateStrain', () => {
  test('carga semanal total multiplicada por monotony', () => {
    const loads: DailyLoadInput[] = [
      { date: daysAgo(0), sessionLoad: 100 },
      { date: daysAgo(1), sessionLoad: 300 },
    ];

    const strain = calculateStrain(loads, REF, 2);
    expect(strain).toBeCloseTo(800); // (100+300) * 2
  });

  test('devuelve null si monotony es null', () => {
    const loads: DailyLoadInput[] = [{ date: daysAgo(0), sessionLoad: 100 }];

    expect(calculateStrain(loads, REF, null)).toBeNull();
  });
});

describe('calculateRecoveryIndex', () => {
  test('promedia sleepQuality/energyLevel directos e invierte soreness/estrés', () => {
    const checkIn: CheckInInput = {
      date: REF,
      sleepQuality: 8,
      energyLevel: 8,
      muscleSoreness: 2,
      stressLevel: 2,
    };

    // avg(8, 8, 10-2, 10-2) * 10 = avg(8,8,8,8) * 10 = 80
    expect(calculateRecoveryIndex(checkIn)).toBeCloseTo(80);
  });

  test('devuelve null si no hay check-in', () => {
    expect(calculateRecoveryIndex(null)).toBeNull();
  });
});

describe('selectRecoveryCheckIn', () => {
  test('prioriza el check-in de hoy si existe', () => {
    const today: CheckInInput = {
      date: REF,
      sleepQuality: 5,
      energyLevel: 5,
      muscleSoreness: 5,
      stressLevel: 5,
    };
    const older: CheckInInput = {
      date: daysAgo(1),
      sleepQuality: 9,
      energyLevel: 9,
      muscleSoreness: 1,
      stressLevel: 1,
    };

    expect(selectRecoveryCheckIn([older, today], REF)).toBe(today);
  });

  test('usa el más reciente dentro de los últimos 3 días si no hay uno de hoy', () => {
    const threeDaysAgo: CheckInInput = {
      date: daysAgo(3),
      sleepQuality: 6,
      energyLevel: 6,
      muscleSoreness: 6,
      stressLevel: 6,
    };
    const oneDayAgo: CheckInInput = {
      date: daysAgo(1),
      sleepQuality: 7,
      energyLevel: 7,
      muscleSoreness: 7,
      stressLevel: 7,
    };

    expect(selectRecoveryCheckIn([threeDaysAgo, oneDayAgo], REF)).toBe(oneDayAgo);
  });

  test('devuelve null si no hay check-ins en los últimos 3 días', () => {
    const tooOld: CheckInInput = {
      date: daysAgo(4),
      sleepQuality: 5,
      energyLevel: 5,
      muscleSoreness: 5,
      stressLevel: 5,
    };

    expect(selectRecoveryCheckIn([tooOld], REF)).toBeNull();
  });

  test('devuelve null si no hay ningún check-in', () => {
    expect(selectRecoveryCheckIn([], REF)).toBeNull();
  });
});

describe('zoneFromAcwr', () => {
  test.each([
    [0.79, 'YELLOW'],
    [0.8, 'GREEN'],
    [1.05, 'GREEN'],
    [1.3, 'GREEN'],
    [1.31, 'YELLOW'],
    [1.5, 'YELLOW'],
    [1.51, 'RED'],
  ])('acwr %s -> %s', (acwr, expected) => {
    expect(zoneFromAcwr(acwr)).toBe(expected);
  });

  test('null -> null', () => {
    expect(zoneFromAcwr(null)).toBeNull();
  });
});

describe('zoneFromRecovery', () => {
  test.each([
    [70, 'GREEN'],
    [100, 'GREEN'],
    [69, 'YELLOW'],
    [40, 'YELLOW'],
    [39, 'RED'],
    [0, 'RED'],
  ])('recoveryIndex %s -> %s', (value, expected) => {
    expect(zoneFromRecovery(value)).toBe(expected);
  });

  test('null -> null', () => {
    expect(zoneFromRecovery(null)).toBeNull();
  });
});

describe('combineZones', () => {
  test('la zona más severa gana (RED sobre YELLOW)', () => {
    expect(combineZones('RED', 'YELLOW')).toBe('RED');
  });

  test('la zona más severa gana (YELLOW sobre GREEN)', () => {
    expect(combineZones('GREEN', 'YELLOW')).toBe('YELLOW');
  });

  test('si ambas son iguales devuelve esa misma', () => {
    expect(combineZones('GREEN', 'GREEN')).toBe('GREEN');
  });

  test('si una es null, devuelve la otra', () => {
    expect(combineZones(null, 'YELLOW')).toBe('YELLOW');
    expect(combineZones('RED', null)).toBe('RED');
  });

  test('si ambas son null, devuelve null', () => {
    expect(combineZones(null, null)).toBeNull();
  });
});

describe('calculateScore', () => {
  test('usa el mínimo entre acwrSubScore y recoveryIndex cuando ambos existen', () => {
    expect(calculateScore(100, 60)).toBe(60);
  });

  test('usa el que exista si falta uno', () => {
    expect(calculateScore(100, null)).toBe(100);
    expect(calculateScore(null, 60)).toBe(60);
  });

  test('devuelve null si ninguno existe', () => {
    expect(calculateScore(null, null)).toBeNull();
  });
});

describe('determineConfidence', () => {
  test('"full" si el historial cubre 28 días o más', () => {
    const loads: DailyLoadInput[] = [{ date: daysAgo(27), sessionLoad: 100 }];

    expect(determineConfidence(loads, REF)).toBe('full');
  });

  test('"low" si el historial cubre menos de 28 días', () => {
    const loads: DailyLoadInput[] = [{ date: daysAgo(10), sessionLoad: 100 }];

    expect(determineConfidence(loads, REF)).toBe('low');
  });

  test('"low" sin ningún registro de entrenamiento', () => {
    expect(determineConfidence([], REF)).toBe('low');
  });
});

describe('calculateFatigue (orquestador)', () => {
  test('caso feliz: carga en zona óptima y buena recuperación -> GREEN', () => {
    const loads: DailyLoadInput[] = Array.from({ length: 28 }, (_, i) => ({
      date: daysAgo(i),
      sessionLoad: 300,
    }));
    const checkIns: CheckInInput[] = [
      { date: REF, sleepQuality: 8, energyLevel: 8, muscleSoreness: 2, stressLevel: 2 },
    ];

    const result = calculateFatigue({ referenceDate: REF, trainingLoads: loads, checkIns });

    expect(result.zone).toBe('GREEN');
    expect(result.confidence).toBe('full');
    expect(result.recoveryIndex).toBeCloseTo(80);
  });

  test('caso límite: sin ningún dato -> 200 lógico con todo en null, no explota', () => {
    const result = calculateFatigue({ referenceDate: REF, trainingLoads: [], checkIns: [] });

    expect(result.acwr).toBeNull();
    expect(result.monotony).toBeNull();
    expect(result.strain).toBeNull();
    expect(result.recoveryIndex).toBeNull();
    expect(result.score).toBeNull();
    expect(result.zone).toBeNull();
    expect(result.confidence).toBe('low');
    expect(result.recommendation.length).toBeGreaterThan(0);
  });

  test('caso límite: misma carga todos los días -> monotony/strain null pero el resto no explota', () => {
    const loads: DailyLoadInput[] = Array.from({ length: 28 }, (_, i) => ({
      date: daysAgo(i),
      sessionLoad: 250,
    }));

    const result = calculateFatigue({ referenceDate: REF, trainingLoads: loads, checkIns: [] });

    expect(result.monotony).toBeNull();
    expect(result.strain).toBeNull();
    expect(result.acwr).toBeCloseTo(1);
    expect(result.zone).toBe('GREEN');
  });

  test('el peor de los dos manda: ACWR ideal pero mala recuperación -> no queda en GREEN', () => {
    const loads: DailyLoadInput[] = Array.from({ length: 28 }, (_, i) => ({
      date: daysAgo(i),
      sessionLoad: 300,
    }));
    const checkIns: CheckInInput[] = [
      { date: REF, sleepQuality: 2, energyLevel: 2, muscleSoreness: 9, stressLevel: 9 },
    ];

    const result = calculateFatigue({ referenceDate: REF, trainingLoads: loads, checkIns });

    expect(result.zone).not.toBe('GREEN');
  });
});
