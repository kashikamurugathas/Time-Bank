import express from 'express';
import dotenv from 'dotenv';
import subscriptionRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('subscription-service');
const app = express();
const PORT = SERVICES.subscriptions.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/', subscriptionRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/subscriptions/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Subscription Microservice listening independently on port ${PORT}`);
  });
}

export default app;
