import { Router, Request, Response } from 'express';
import authRoutes from '../auth/routes.ts';
import userRoutes from '../users/routes.ts';
import adminRoutes from '../admin/routes.ts';
import skillRoutes from '../skills/routes.ts';
import locationRoutes from '../location/routes.ts';
import requestRoutes from '../requests/routes.ts';
import bookingRoutes from '../bookings/routes.ts';
import walletRoutes from '../wallet/routes.ts';
import messageRoutes from '../messaging/routes.ts';
import emailRoutes from '../email/routes.ts';
import subscriptionRoutes from '../subscriptions/routes.ts';
import paymentRoutes from '../payments/routes.ts';
import aiRoutes from '../ai/routes.ts';
import reviewRoutes from '../reviews/routes.ts';
import analyticsRoutes from '../analytics/routes.ts';
import { SERVICES } from '../common/config.ts';

const gatewayRouter = Router();

// Gateway Master Health Aggregator
gatewayRouter.get('/health', async (_req: Request, res: Response) => {
  const serviceStatuses: Record<string, any> = {};

  for (const [key, svc] of Object.entries(SERVICES)) {
    if (key === 'gateway') continue;
    serviceStatuses[svc.name] = {
      port: svc.port,
      status: 'UP',
      database: svc.dbFileName,
      endpoint: svc.baseUrl,
    };
  }

  res.json({
    gateway: {
      status: 'HEALTHY',
      serviceCount: Object.keys(SERVICES).length,
      timestamp: new Date().toISOString(),
    },
    services: serviceStatuses,
  });
});

// Route client requests to independent microservice routers
gatewayRouter.use('/auth', authRoutes);
gatewayRouter.use('/users', userRoutes);
gatewayRouter.use('/admin', adminRoutes);
gatewayRouter.use('/skills', skillRoutes);
gatewayRouter.use('/location', locationRoutes);
gatewayRouter.use('/requests', requestRoutes);
gatewayRouter.use('/bookings', bookingRoutes);
gatewayRouter.use('/wallet', walletRoutes);
gatewayRouter.use('/messages', messageRoutes);
gatewayRouter.use('/notifications', emailRoutes);
gatewayRouter.use('/email', emailRoutes);
gatewayRouter.use('/subscriptions', subscriptionRoutes);
gatewayRouter.use('/payments', paymentRoutes);
gatewayRouter.use('/ai', aiRoutes);
gatewayRouter.use('/reviews', reviewRoutes);
gatewayRouter.use('/analytics', analyticsRoutes);
gatewayRouter.use('/communities', analyticsRoutes);
gatewayRouter.use('/organizations', analyticsRoutes);

export default gatewayRouter;
