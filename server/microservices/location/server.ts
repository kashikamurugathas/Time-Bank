import express from 'express';
import dotenv from 'dotenv';
import locationRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('location-recommendation-service');
const app = express();
const PORT = SERVICES.location.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/location', locationRoutes);
app.use('/', locationRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/location/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Location Recommendation Microservice listening independently on port ${PORT}`);
  });
}

export default app;
