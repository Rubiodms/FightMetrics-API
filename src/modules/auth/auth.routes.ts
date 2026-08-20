import { Router } from 'express';

// TODO: implementar en el siguiente sprint
const router = Router();

router.all('/', (_req, res) => {
  res.status(501).json({ error: { message: 'No implementado todavía', statusCode: 501 } });
});

router.all('/*splat', (_req, res) => {
  res.status(501).json({ error: { message: 'No implementado todavía', statusCode: 501 } });
});

export default router;
