import { PrismaClient } from '@prisma/client';

// Instancia singleton de PrismaClient: evita abrir múltiples conexiones
// cuando distintos módulos importan el cliente de base de datos.
export const prisma = new PrismaClient();
