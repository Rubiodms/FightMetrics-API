import type { User } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../shared/errors/app-error';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function getUserProfile(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return toSafeUser(user);
}
