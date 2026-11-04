import express from 'express';
import dotenv from 'dotenv';
import messageRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('messaging-service');
const app = express();
const PORT = SERVICES.messaging.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/messages', messageRoutes);
app.use('/', messageRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/messaging/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Messaging Microservice listening independently on port ${PORT}`);
  });
}

export default app;
