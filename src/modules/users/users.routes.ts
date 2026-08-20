import { Router } from 'express';
import { getMe } from './users.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

router.get('/me', authMiddleware, asyncHandler(getMe));

export default router;
