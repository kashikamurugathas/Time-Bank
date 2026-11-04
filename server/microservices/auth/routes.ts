import { Router, Response } from 'express';
import { authService } from './service.ts';
import { authenticateToken, AuthenticatedRequest } from '../common/auth-middleware.ts';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    res.status(err.status || 400).json({ error: err.message || 'An unexpected error occurred.' });
  });
};

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

router.post('/register', asyncHandler(async (req: any, res: Response) => {
  const result = await authService.register(req.body);
  res.json(result);
}));

router.post('/login', asyncHandler(async (req: any, res: Response) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const result = await authService.login(email, password, Boolean(rememberMe));
  res.json(result);
}));

router.post('/change-password', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  res.json(result);
}));

router.post('/forgot-password', asyncHandler(async (req: any, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  res.json(result);
}));

router.post('/reset-password', asyncHandler(async (req: any, res: Response) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPasswordWithToken(token, newPassword);
  res.json(result);
}));

// Internal inter-service endpoint to update status
router.post('/internal/update-status', asyncHandler(async (req: any, res: Response) => {
  const { userId, status, reason } = req.body;
  authService.updateUserStatus(userId, status, reason);
  res.json({ success: true });
}));

export default router;
