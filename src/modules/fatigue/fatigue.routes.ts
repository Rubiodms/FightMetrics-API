import { Router } from 'express';
import { getToday } from './fatigue.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

router.use(authMiddleware);

router.get('/today', asyncHandler(getToday));

export default router;
