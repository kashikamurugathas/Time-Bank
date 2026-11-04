import { Router, Response } from 'express';
import { userService } from './service.ts';
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
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await userService.getFullUserProfile(req.user!.userId);
  res.json(profile);
}));

router.put('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updated = await userService.updateProfile(req.user!.userId, req.body);
  res.json(updated);
}));

router.post('/profile-photo', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { photoData, mimeType } = req.body;
  const result = await userService.uploadProfilePicture(req.user!.userId, photoData, mimeType);
  res.json(result);
}));

router.delete('/profile-photo', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await userService.removeProfilePicture(req.user!.userId);
  res.json(result);
}));

router.get('/public/:id', asyncHandler(async (req: any, res: Response) => {
  const profile = await userService.getPublicProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Member not found.' });
  res.json(profile);
}));

// Internal inter-service endpoints
router.get('/internal/user/:id', asyncHandler(async (req: any, res: Response) => {
  const profile = await userService.getFullUserProfile(req.params.id);
  res.json(profile);
}));

router.post('/internal/update-status', asyncHandler(async (req: any, res: Response) => {
  const { userId, status } = req.body;
  userService.updateUserStatus(userId, status);
  res.json({ success: true });
}));

router.get('/internal/admin-users', asyncHandler(async (req: any, res: Response) => {
  const users = userService.getAllUsersForAdmin(req.query);
  res.json(users);
}));

export default router;
