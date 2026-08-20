import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { generateOpenApiDocument } from './docs/openapi';
import { notFoundHandler } from './shared/middlewares/not-found.middleware';
import { errorHandler } from './shared/middlewares/error-handler.middleware';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import trainingLogsRoutes from './modules/training-logs/training-logs.routes';
import checkInsRoutes from './modules/check-ins/check-ins.routes';
import fatigueRoutes from './modules/fatigue/fatigue.routes';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ level: env.LOG_LEVEL }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/training-logs', trainingLogsRoutes);
app.use('/api/v1/check-ins', checkInsRoutes);
app.use('/api/v1/fatigue', fatigueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
