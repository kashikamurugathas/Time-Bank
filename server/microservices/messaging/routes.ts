import { Router, Response } from 'express';
import { messagingService } from './service.ts';
import { authenticateToken, requireApproved, AuthenticatedRequest } from '../common/auth-middleware.ts';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    res.status(err.status || 400).json({ error: err.message || 'An unexpected error occurred.' });
  });
};

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'messaging-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/conversations', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const convs = await messagingService.getUserConversations(req.user!.userId);
  res.json(convs);
}));

router.get('/conversations/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const messages = await messagingService.getMessages(req.params.id, req.user!.userId);
  res.json(messages);
}));

router.post('/send', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { recipientId, content, relatedBookingId } = req.body;
  const result = await messagingService.sendMessage(req.user!.userId, recipientId, content, relatedBookingId);
  res.json(result);
}));

router.get('/unread-count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const count = await messagingService.getUnreadCount(req.user!.userId);
  res.json({ count });
}));

export default router;
