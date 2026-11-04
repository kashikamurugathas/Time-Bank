import { Router, Response } from 'express';
import { locationRecommendationService } from './service.ts';
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
    service: 'location-recommendation-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/nearby-helpers', asyncHandler(async (req: any, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || 9.6749;
  const lng = parseFloat(req.query.lng as string) || 80.0292;
  const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;

  const result = await locationRecommendationService.getNearbyHelpers({
    latitude: lat,
    longitude: lng,
    skillId: req.query.skillId as string,
    category: req.query.category as string,
    searchKeyword: req.query.search as string,
    maxRadiusKm: radius,
    excludeUserId: req.query.excludeUserId as string
  });
  res.json(result);
}));

router.put('/update-location', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude, address, city, district } = req.body;
  locationRecommendationService.updateUserLocation(req.user!.userId, latitude, longitude, address, city, district);
  res.json({ success: true, message: 'Location updated.' });
}));

export default router;
