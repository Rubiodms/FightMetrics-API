import type { Request, Response } from 'express';
import { getTodayFatigue } from './fatigue.service';

export async function getToday(req: Request, res: Response): Promise<void> {
  const result = await getTodayFatigue(req.user!.id);
  res.status(200).json(result);
}
