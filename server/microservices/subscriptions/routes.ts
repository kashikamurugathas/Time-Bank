import { Router, Response } from 'express';
import { subscriptionService } from './service.ts';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../common/auth-middleware.ts';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    res.status(err.status || 400).json({ error: err.message || 'An unexpected error occurred.' });
  });
};

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'subscription-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/plans', asyncHandler(async (_req: any, res: Response) => {
  const plans = await subscriptionService.getPlans();
  res.json(plans);
}));

router.get('/my-subscription', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sub = await subscriptionService.getUserSubscription(req.user!.userId);
  res.json(sub);
}));

router.put('/admin/plans/:id', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updated = await subscriptionService.updatePlan(req.user!.userId, req.params.id, req.body);
  res.json(updated);
}));

router.post('/cancel', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await subscriptionService.cancelSubscription(req.user!.userId);
  res.json(result);
}));

export default router;
