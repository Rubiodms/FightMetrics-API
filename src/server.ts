import pino from 'pino';
import { app } from './app';
import { env } from './config/env';

const logger = pino({ level: env.LOG_LEVEL });

app.listen(env.PORT, () => {
  logger.info(`🚀 FightMetrics API escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});
