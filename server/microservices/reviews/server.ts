import express from 'express';
import dotenv from 'dotenv';
import reviewRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('review-rating-service');
const app = express();
const PORT = SERVICES.reviews.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/reviews', reviewRoutes);
app.use('/', reviewRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/reviews/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Review & Rating Microservice listening independently on port ${PORT}`);
  });
}

export default app;
