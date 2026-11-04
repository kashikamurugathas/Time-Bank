import express from 'express';
import dotenv from 'dotenv';
import aiRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('ai-agent-service');
const app = express();
const PORT = SERVICES.ai.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/ai', aiRoutes);
app.use('/', aiRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/ai/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`AI Agent Microservice listening independently on port ${PORT}`);
  });
}

export default app;
