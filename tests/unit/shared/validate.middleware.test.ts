import type { NextFunction, Request, Response } from 'express';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { validateBody } from '@/shared/middlewares/validate.middleware';
import { AppError } from '@/shared/errors/app-error';

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().positive(),
});

describe('validateBody', () => {
  test('llama a next() sin argumentos y normaliza req.body cuando el payload es válido', () => {
    const req = { body: { email: 'atleta@fightmetrics.dev', age: 30 } } as unknown as Request;
    const next = vi.fn() as NextFunction;

    validateBody(schema)(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: 'atleta@fightmetrics.dev', age: 30 });
  });

  test('llama a next con AppError 400 cuando el payload es inválido', () => {
    const req = { body: { email: 'no-es-email', age: -1 } } as unknown as Request;
    const next = vi.fn() as NextFunction;

    validateBody(schema)(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(400);
  });

  test('el mensaje de error incluye el campo que falló', () => {
    const req = { body: { email: 'no-es-email', age: 30 } } as unknown as Request;
    const next = vi.fn() as NextFunction;

    validateBody(schema)(req, {} as Response, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(err.message).toContain('email');
  });
});
