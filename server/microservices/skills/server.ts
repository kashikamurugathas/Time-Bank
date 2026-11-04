import express from 'express';
import dotenv from 'dotenv';
import skillRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('skill-management-service');
const app = express();
const PORT = SERVICES.skills.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/skills', skillRoutes);
app.use('/', skillRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/skills/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Skill Management Microservice listening independently on port ${PORT}`);
  });
}

export default app;
