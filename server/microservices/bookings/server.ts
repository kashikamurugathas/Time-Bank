import express from 'express';
import dotenv from 'dotenv';
import bookingRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('booking-scheduling-service');
const app = express();
const PORT = SERVICES.bookings.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/bookings', bookingRoutes);
app.use('/', bookingRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/bookings/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Booking & Scheduling Microservice listening independently on port ${PORT}`);
  });
}

export default app;
