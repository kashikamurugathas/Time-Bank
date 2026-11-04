import { Router, Response } from 'express';
import { reviewService } from './service.ts';
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
    service: 'review-rating-service',
    timestamp: new Date().toISOString(),
  });
});

router.post('/', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId, rating, comment } = req.body;
  const review = await reviewService.createReview(req.user!.userId, bookingId, rating, comment);
  res.json(review);
}));

router.get('/user/:id', asyncHandler(async (req: any, res: Response) => {
  const reviews = await reviewService.getUserReviews(req.params.id);
  res.json(reviews);
}));

export default router;
