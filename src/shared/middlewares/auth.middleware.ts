import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { verifyToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- forma estándar de augmentar los tipos de Express
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError('No autorizado', 401));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError('No autorizado', 401));
  }
}
