import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error';

// Middleware genérico de validación: parsea req.body contra un ZodType,
// lo reemplaza por la versión ya tipada/normalizada, o corta con un
// AppError 400 legible que el error-handler formatea de forma consistente.
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      next(new AppError(`Datos inválidos: ${message}`, 400));
      return;
    }

    req.body = result.data;
    next();
  };
}
