import { Router } from 'express';
import { create, getById, list, remove, update } from './training-logs.controller';
import { createTrainingLogSchema, updateTrainingLogSchema } from './training-logs.schema';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

router.use(authMiddleware);

router.post('/', validateBody(createTrainingLogSchema), asyncHandler(create));
router.get('/', asyncHandler(list));
router.get('/:id', asyncHandler(getById));
router.patch('/:id', validateBody(updateTrainingLogSchema), asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

export default router;
