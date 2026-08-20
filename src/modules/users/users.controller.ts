import type { Request, Response } from 'express';
import { getUserProfile } from './users.service';

export async function getMe(req: Request, res: Response): Promise<void> {
  const profile = await getUserProfile(req.user!.id);
  res.status(200).json(profile);
}
