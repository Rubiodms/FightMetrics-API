import type { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body);
  res.status(200).json(result);
}
