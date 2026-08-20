import type { NextFunction, Request, Response } from 'express';
import { describe, expect, test, vi } from 'vitest';
import { authMiddleware } from '@/shared/middlewares/auth.middleware';
import { AppError } from '@/shared/errors/app-error';
import { signToken } from '@/shared/utils/jwt';

function buildReq(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

describe('authMiddleware', () => {
  test('adjunta req.user y llama a next() sin argumentos cuando el token es válido', () => {
    const token = signToken({ sub: 'user-1', email: 'atleta@fightmetrics.dev' });
    const req = buildReq(`Bearer ${token}`);
    const next = vi.fn() as NextFunction;

    authMiddleware(req, {} as Response, next);

    expect(req.user).toEqual({ id: 'user-1', email: 'atleta@fightmetrics.dev' });
    expect(next).toHaveBeenCalledWith();
  });

  test('llama a next con AppError 401 si falta el header Authorization', () => {
    const req = buildReq(undefined);
    const next = vi.fn() as NextFunction;

    authMiddleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  test('llama a next con AppError 401 si el header no tiene formato Bearer', () => {
    const req = buildReq('Token abc123');
    const next = vi.fn() as NextFunction;

    authMiddleware(req, {} as Response, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });

  test('llama a next con AppError 401 si el token es inválido', () => {
    const req = buildReq('Bearer token-invalido');
    const next = vi.fn() as NextFunction;

    authMiddleware(req, {} as Response, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});
