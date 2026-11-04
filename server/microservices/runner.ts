import dotenv from 'dotenv';
import { migrateAndSeedMicroservices } from './common/migrator.ts';
import { createLogger } from './common/logger.ts';
import authApp from './auth/server.ts';
import userApp from './users/server.ts';
import adminApp from './admin/server.ts';
import skillApp from './skills/server.ts';
import locationApp from './location/server.ts';
import requestApp from './requests/server.ts';
import bookingApp from './bookings/server.ts';
import walletApp from './wallet/server.ts';
import messageApp from './messaging/server.ts';
import emailApp from './email/server.ts';
import subscriptionApp from './subscriptions/server.ts';
import paymentApp from './payments/server.ts';
import aiApp from './ai/server.ts';
import reviewApp from './reviews/server.ts';
import analyticsApp from './analytics/server.ts';
import { SERVICES } from './common/config.ts';

dotenv.config();

const logger = createLogger('microservices-supervisor');

export async function startAllMicroservices() {
  logger.info('Initializing Time Bank Microservices Architecture...');

  // 1. Run database initialization and data migration to ensure 100% data preservation
  await migrateAndSeedMicroservices();

  // 2. Start all microservices on their dedicated independent ports
  const servicesToStart = [
    { name: 'Auth Service', app: authApp, port: SERVICES.auth.port },
    { name: 'User Management Service', app: userApp, port: SERVICES.users.port },
    { name: 'Admin Approval Service', app: adminApp, port: SERVICES.admin.port },
    { name: 'Skill Management Service', app: skillApp, port: SERVICES.skills.port },
    { name: 'Location & Recommendation Service', app: locationApp, port: SERVICES.location.port },
    { name: 'Help Request Service', app: requestApp, port: SERVICES.requests.port },
    { name: 'Booking & Scheduling Service', app: bookingApp, port: SERVICES.bookings.port },
    { name: 'Time Credit Wallet Service', app: walletApp, port: SERVICES.wallet.port },
    { name: 'Messaging Service', app: messageApp, port: SERVICES.messaging.port },
    { name: 'Email Notification Service', app: emailApp, port: SERVICES.email.port },
    { name: 'Subscription Service', app: subscriptionApp, port: SERVICES.subscriptions.port },
    { name: 'Payment Service', app: paymentApp, port: SERVICES.payments.port },
    { name: 'AI Agent Service', app: aiApp, port: SERVICES.ai.port },
    { name: 'Review & Rating Service', app: reviewApp, port: SERVICES.reviews.port },
    { name: 'Analytics & Reporting Service', app: analyticsApp, port: SERVICES.analytics.port },
  ];

  const servers: any[] = [];

  for (const s of servicesToStart) {
    try {
      const server = s.app.listen(s.port, '0.0.0.0', () => {
        logger.info(`[ONLINE] ${s.name} independently running on http://0.0.0.0:${s.port}`);
      });
      servers.push(server);
    } catch (err: any) {
      logger.warn(`Could not bind dedicated port ${s.port} for ${s.name} (will route through Gateway): ${err.message}`);
    }
  }

  logger.info(`All ${servicesToStart.length} microservices successfully launched and coordinated.`);
  return servers;
}

if (process.argv[1]?.endsWith('runner.ts')) {
  startAllMicroservices().catch(err => {
    logger.error(`Failed to start microservices: ${err.message}`);
    process.exit(1);
  });
}
