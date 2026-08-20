import { Router } from 'express';
import { login, register } from './auth.controller';
import { loginBodySchema, registerBodySchema } from './auth.schema';
import { validateBody } from '../../shared/middlewares/validate.middleware';
import { asyncHandler } from '../../shared/utils/async-handler';

const router = Router();

router.post('/register', validateBody(registerBodySchema), asyncHandler(register));
router.post('/login', validateBody(loginBodySchema), asyncHandler(login));

export default router;
