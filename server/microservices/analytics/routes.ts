import { Router, Response } from 'express';
import { analyticsService } from './service.ts';
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
    service: 'analytics-reporting-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/community-impact', asyncHandler(async (_req: any, res: Response) => {
  const impact = await analyticsService.getCommunityImpactSummary();
  res.json(impact);
}));

router.get('/platform-report', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (_req: any, res: Response) => {
  const report = await analyticsService.getAdminPlatformReport();
  res.json(report);
}));

router.get('/communities/:id', asyncHandler(async (req: any, res: Response) => {
  const comm = await analyticsService.getCommunityDetails(req.params.id);
  if (!comm) return res.status(404).json({ error: 'Community not found.' });
  res.json(comm);
}));

router.get('/organizations/:id', asyncHandler(async (req: any, res: Response) => {
  const org = await analyticsService.getOrganizationDetails(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found.' });
  res.json(org);
}));

export default router;
