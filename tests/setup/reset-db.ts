import { prisma } from '@/config/db';

// Limpia todas las tablas entre tests, respetando el orden de las FKs
// (hijos antes que padres) para no violar restricciones de integridad.
export async function resetDb(): Promise<void> {
  await prisma.fatigueScore.deleteMany();
  await prisma.dailyCheckIn.deleteMany();
  await prisma.trainingLog.deleteMany();
  await prisma.user.deleteMany();
}
