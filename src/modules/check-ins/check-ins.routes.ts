import { Router } from 'express';
import { createOrUpdate, getById, list, remove, update } from './check-ins.controller';
import { createCheckInSchema, updateCheckInSchema } from './check-ins.schema';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

router.use(authMiddleware);

router.post('/', validateBody(createCheckInSchema), asyncHandler(createOrUpdate));
router.get('/', asyncHandler(list));
router.get('/:id', asyncHandler(getById));
router.patch('/:id', validateBody(updateCheckInSchema), asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

export default router;
