import { Router, Response } from 'express';
import { helpRequestService } from './service.ts';
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
    service: 'help-request-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/', asyncHandler(async (req: any, res: Response) => {
  const requests = await helpRequestService.listRequests({
    status: req.query.status as string,
    category: req.query.category as string,
    requesterId: req.query.requesterId as string,
    search: req.query.search as string
  });
  res.json(requests);
}));

router.get('/:id', asyncHandler(async (req: any, res: Response) => {
  const reqData = await helpRequestService.getRequestById(req.params.id);
  if (!reqData) return res.status(404).json({ error: 'Help request not found.' });
  res.json(reqData);
}));

router.post('/', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await helpRequestService.createRequest(req.user!.userId, req.body);
  res.json(result);
}));

router.post('/:id/offers', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await helpRequestService.submitOffer(req.params.id, req.user!.userId, req.body);
  res.json(result);
}));

router.post('/:id/accept-offer', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { offerId } = req.body;
  const result = await helpRequestService.acceptOffer(req.params.id, offerId, req.user!.userId);
  res.json(result);
}));

router.post('/:id/cancel', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await helpRequestService.cancelRequest(req.params.id, req.user!.userId);
  res.json(result);
}));

export default router;
