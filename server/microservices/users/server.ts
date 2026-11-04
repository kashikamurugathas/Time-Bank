import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('user-service');
const app = express();
const PORT = SERVICES.users.port;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/users', userRoutes);
app.use('/', userRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/users/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`User Management Microservice listening independently on port ${PORT}`);
  });
}

export default app;
