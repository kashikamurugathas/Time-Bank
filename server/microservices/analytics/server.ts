import express from 'express';
import dotenv from 'dotenv';
import analyticsRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('analytics-reporting-service');
const app = express();
const PORT = SERVICES.analytics.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/analytics', analyticsRoutes);
app.use('/api/communities', analyticsRoutes);
app.use('/api/organizations', analyticsRoutes);
app.use('/', analyticsRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/analytics/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Analytics Microservice listening independently on port ${PORT}`);
  });
}

export default app;
