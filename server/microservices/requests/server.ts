import express from 'express';
import dotenv from 'dotenv';
import requestRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('help-request-service');
const app = express();
const PORT = SERVICES.requests.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/requests', requestRoutes);
app.use('/', requestRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/requests/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Help Request Microservice listening independently on port ${PORT}`);
  });
}

export default app;
