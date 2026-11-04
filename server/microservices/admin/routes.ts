import { Router, Response } from 'express';
import { adminApprovalService } from './service.ts';
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
    service: 'admin-approval-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/pending-approvals', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req: any, res: Response) => {
  const pending = await adminApprovalService.getPendingRegistrations();
  res.json(pending);
}));

router.get('/users', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const users = await adminApprovalService.getAllUsers(req.query);
  res.json(users);
}));

router.post('/approve-user', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, notes } = req.body;
  const result = await adminApprovalService.approveUser(req.user!.userId, userId, notes);
  res.json(result);
}));

router.post('/reject-user', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, reason } = req.body;
  const result = await adminApprovalService.rejectUser(req.user!.userId, userId, reason);
  res.json(result);
}));

router.post('/suspend-user', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, suspend, reason } = req.body;
  const result = await adminApprovalService.toggleSuspendUser(req.user!.userId, userId, Boolean(suspend), reason);
  res.json(result);
}));

router.get('/audit-logs', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req: any, res: Response) => {
  const logs = await adminApprovalService.getAuditLogs();
  res.json(logs);
}));

export default router;
