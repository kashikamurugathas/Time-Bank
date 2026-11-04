import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('auth-service');
const app = express();
const PORT = SERVICES.auth.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/', authRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/auth/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Auth Microservice listening independently on port ${PORT}`);
  });
}

export default app;
