import express from 'express';
import dotenv from 'dotenv';
import gatewayRouter from './router.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('api-gateway');
const app = express();
const PORT = SERVICES.gateway.port;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', gatewayRouter);

app.get('/health', (_req, res) => {
  res.json({
    gateway: 'API Gateway Service',
    status: 'HEALTHY',
    version: '2.0.0-microservices',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/gateway/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Time Bank API Gateway listening independently on port ${PORT}`);
  });
}

export default app;
