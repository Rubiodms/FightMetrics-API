import type { NextFunction, Request, Response } from 'express';

// TODO: implementar en el siguiente sprint
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  next();
}
