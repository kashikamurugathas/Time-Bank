import express from 'express';
import dotenv from 'dotenv';
import emailRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('email-notification-service');
const app = express();
const PORT = SERVICES.email.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/notifications', emailRoutes);
app.use('/api/email', emailRoutes);
app.use('/', emailRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/email/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Email Notification Microservice listening independently on port ${PORT}`);
  });
}

export default app;
