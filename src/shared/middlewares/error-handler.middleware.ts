import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';

// Middleware de 4 argumentos: Express lo reconoce como error handler solo por esta firma.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  req.log?.error({ err }, 'Error no controlado');

  res.status(500).json({
    error: {
      message: 'Error interno del servidor',
      statusCode: 500,
    },
  });
}
