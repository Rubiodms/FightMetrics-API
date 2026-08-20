import type { Request, Response } from 'express';
import {
  createOrUpdateCheckIn,
  deleteCheckIn,
  getCheckInById,
  listCheckIns,
  updateCheckIn,
} from './check-ins.service';

export async function createOrUpdate(req: Request, res: Response): Promise<void> {
  const { checkIn, created } = await createOrUpdateCheckIn(req.user!.id, req.body);
  res.status(created ? 201 : 200).json(checkIn);
}

export async function list(req: Request, res: Response): Promise<void> {
  const checkIns = await listCheckIns(req.user!.id);
  res.status(200).json(checkIns);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const checkIn = await getCheckInById(req.user!.id, req.params.id as string);
  res.status(200).json(checkIn);
}

export async function update(req: Request, res: Response): Promise<void> {
  const checkIn = await updateCheckIn(req.user!.id, req.params.id as string, req.body);
  res.status(200).json(checkIn);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteCheckIn(req.user!.id, req.params.id as string);
  res.status(204).send();
}
