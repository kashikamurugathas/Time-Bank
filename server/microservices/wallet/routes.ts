import { Router, Response } from 'express';
import { walletService } from './service.ts';
import { authenticateToken, requireApproved, requireRole, AuthenticatedRequest } from '../common/auth-middleware.ts';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    res.status(err.status || 400).json({ error: err.message || 'An unexpected error occurred.' });
  });
};

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'time-credit-wallet-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const wallet = await walletService.getWallet(req.user!.userId);
  res.json(wallet);
}));

router.post('/transfer', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { toUserId, amount, description } = req.body;
  const result = await walletService.transferCredits(req.user!.userId, toUserId, parseFloat(amount), undefined, description);
  res.json(result);
}));

router.get('/admin/transactions', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req: any, res: Response) => {
  const txs = await walletService.getAllTransactions();
  res.json(txs);
}));

router.post('/admin/wallet-adjust', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId, amount, reason } = req.body;
  const result = await walletService.adminAdjustCredits(req.user!.userId, targetUserId, parseFloat(amount), reason);
  res.json(result);
}));

export default router;
