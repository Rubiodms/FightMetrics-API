// Seed mínimo para poder probar el algoritmo de fatiga en el siguiente sprint
// sin tener que crear datos a mano.
import { PrismaClient, TrainingType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(6, 0, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash('P@ssword123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'athlete@fightmetrics.dev' },
    update: {},
    create: {
      email: 'athlete@fightmetrics.dev',
      passwordHash,
      name: 'Atleta de Prueba',
      bodyweightKg: 77.5,
      sport: 'MMA',
    },
  });

  const trainingLogsData: {
    daysAgo: number;
    type: TrainingType;
    durationMin: number;
    rpe: number;
  }[] = [
    { daysAgo: 9, type: TrainingType.STRENGTH, durationMin: 60, rpe: 6 },
    { daysAgo: 8, type: TrainingType.GRAPPLING, durationMin: 90, rpe: 8 },
    { daysAgo: 6, type: TrainingType.STRIKING, durationMin: 75, rpe: 7 },
    { daysAgo: 5, type: TrainingType.CONDITIONING, durationMin: 45, rpe: 9 },
    { daysAgo: 3, type: TrainingType.MMA_SPARRING, durationMin: 60, rpe: 9 },
    { daysAgo: 2, type: TrainingType.MOBILITY, durationMin: 30, rpe: 3 },
    { daysAgo: 1, type: TrainingType.POWER, durationMin: 50, rpe: 7 },
  ];

  for (const log of trainingLogsData) {
    const date = daysAgo(log.daysAgo);
    await prisma.trainingLog.create({
      data: {
        userId: user.id,
        date,
        type: log.type,
        durationMin: log.durationMin,
        rpe: log.rpe,
        sessionLoad: log.durationMin * log.rpe,
      },
    });
  }

  const checkInsData: {
    daysAgo: number;
    sleepHours: number;
    sleepQuality: number;
    muscleSoreness: number;
    energyLevel: number;
    stressLevel: number;
  }[] = [
    { daysAgo: 9, sleepHours: 7.5, sleepQuality: 8, muscleSoreness: 2, energyLevel: 8, stressLevel: 3 },
    { daysAgo: 8, sleepHours: 6.5, sleepQuality: 6, muscleSoreness: 4, energyLevel: 6, stressLevel: 4 },
    { daysAgo: 6, sleepHours: 7, sleepQuality: 7, muscleSoreness: 5, energyLevel: 6, stressLevel: 5 },
    { daysAgo: 5, sleepHours: 5.5, sleepQuality: 5, muscleSoreness: 7, energyLevel: 4, stressLevel: 6 },
    { daysAgo: 3, sleepHours: 6, sleepQuality: 5, muscleSoreness: 8, energyLevel: 3, stressLevel: 7 },
    { daysAgo: 2, sleepHours: 8, sleepQuality: 8, muscleSoreness: 4, energyLevel: 7, stressLevel: 3 },
    { daysAgo: 1, sleepHours: 7, sleepQuality: 7, muscleSoreness: 3, energyLevel: 7, stressLevel: 4 },
  ];

  for (const checkIn of checkInsData) {
    const date = daysAgo(checkIn.daysAgo);
    await prisma.dailyCheckIn.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: {},
      create: {
        userId: user.id,
        date,
        sleepHours: checkIn.sleepHours,
        sleepQuality: checkIn.sleepQuality,
        muscleSoreness: checkIn.muscleSoreness,
        energyLevel: checkIn.energyLevel,
        stressLevel: checkIn.stressLevel,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Seed completado para ${user.email}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Error en el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
