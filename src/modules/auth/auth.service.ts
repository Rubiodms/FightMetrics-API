import bcrypt from 'bcrypt';
import { prisma } from '../../config/db';
import { AppError } from '../../shared/errors/app-error';
import { signToken } from '../../shared/utils/jwt';
import { toSafeUser, type SafeUser } from '../users/users.service';
import type { LoginInput, RegisterInput } from './auth.schema';

const SALT_ROUNDS = 10;

interface AuthResult {
  user: SafeUser;
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new AppError('El email ya está registrado', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      bodyweightKg: input.bodyweightKg,
      sport: input.sport,
    },
  });

  const token = signToken({ sub: user.id, email: user.email });

  return { user: toSafeUser(user), token };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const token = signToken({ sub: user.id, email: user.email });

  return { user: toSafeUser(user), token };
}
