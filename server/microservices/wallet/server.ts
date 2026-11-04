import express from 'express';
import dotenv from 'dotenv';
import walletRoutes from './routes.ts';
import { SERVICES } from '../common/config.ts';
import { createLogger } from '../common/logger.ts';

dotenv.config();

const logger = createLogger('time-credit-wallet-service');
const app = express();
const PORT = SERVICES.wallet.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/wallet', walletRoutes);
app.use('/', walletRoutes);

if (process.env.STANDALONE === 'true' || process.argv[1].endsWith('server/microservices/wallet/server.ts')) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Time Credit Wallet Microservice listening independently on port ${PORT}`);
  });
}

export default app;
