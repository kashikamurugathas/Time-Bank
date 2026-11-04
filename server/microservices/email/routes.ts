import { Router, Response } from 'express';
import { emailService } from './service.ts';
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
    service: 'email-notification-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notifs = await emailService.getUserNotifications(req.user!.userId);
  res.json(notifs);
}));

router.post('/:id/read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await emailService.markNotificationRead(req.params.id, req.user!.userId);
  res.json(result);
}));

router.post('/read-all', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await emailService.markAllRead(req.user!.userId);
  res.json(result);
}));

router.get('/email-logs', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req: any, res: Response) => {
  const logs = await emailService.getEmailLogs();
  res.json(logs);
}));

export default router;
