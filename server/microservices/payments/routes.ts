import { Router, Response } from 'express';
import { paymentService } from './service.ts';
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
    service: 'payment-service',
    timestamp: new Date().toISOString(),
  });
});

router.post('/initiate', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { planId, communityId, organizationId } = req.body;
  const checkoutPayload = await paymentService.initiatePayment(req.user!.userId, planId, communityId, organizationId);
  res.json(checkoutPayload);
}));

router.post('/process', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await paymentService.processPayment(req.user!.userId, req.body);
  res.json(result);
}));

router.get('/my-payments', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payments = await paymentService.getUserPayments(req.user!.userId);
  res.json(payments);
}));

router.get('/admin/payments', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req: any, res: Response) => {
  const payments = await paymentService.getAllPayments();
  res.json(payments);
}));

export default router;
