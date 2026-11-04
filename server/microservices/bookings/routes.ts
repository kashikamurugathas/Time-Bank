import { Router, Response } from 'express';
import { bookingService } from './service.ts';
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
    service: 'booking-scheduling-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookings = await bookingService.getUserBookings(req.user!.userId, req.query.role as any);
  res.json(bookings);
}));

router.get('/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
}));

router.post('/direct', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.createDirectBooking(req.user!.userId, req.body);
  res.json(booking);
}));

router.post('/:id/confirm-completion', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await bookingService.confirmCompletion(req.params.id, req.user!.userId);
  res.json(result);
}));

router.post('/:id/reschedule', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { newDate, newTime, reason } = req.body;
  const result = await bookingService.rescheduleBooking(req.params.id, req.user!.userId, newDate, newTime, reason);
  res.json(result);
}));

router.post('/:id/accept-reschedule', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await bookingService.acceptReschedule(req.params.id, req.user!.userId);
  res.json(result);
}));

router.post('/:id/cancel', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const result = await bookingService.cancelBooking(req.params.id, req.user!.userId, reason);
  res.json(result);
}));

export default router;
