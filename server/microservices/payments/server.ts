import express from 'express';
import dotenv from 'dotenv';
import paymentRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('payment-service');
const app = express();
const PORT = SERVICES.payments.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/payments', paymentRoutes);
app.use('/', paymentRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/payments/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Payment Microservice listening independently on port ${PORT}`);
  });
}

export default app;
