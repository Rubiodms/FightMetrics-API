import type { Request, Response } from 'express';
import {
  createTrainingLog,
  deleteTrainingLog,
  getTrainingLogById,
  listTrainingLogs,
  updateTrainingLog,
} from './training-logs.service';

export async function create(req: Request, res: Response): Promise<void> {
  const log = await createTrainingLog(req.user!.id, req.body);
  res.status(201).json(log);
}

export async function list(req: Request, res: Response): Promise<void> {
  const logs = await listTrainingLogs(req.user!.id);
  res.status(200).json(logs);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const log = await getTrainingLogById(req.user!.id, req.params.id as string);
  res.status(200).json(log);
}

export async function update(req: Request, res: Response): Promise<void> {
  const log = await updateTrainingLog(req.user!.id, req.params.id as string, req.body);
  res.status(200).json(log);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteTrainingLog(req.user!.id, req.params.id as string);
  res.status(204).send();
}
