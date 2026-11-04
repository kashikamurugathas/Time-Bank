import { Router, Response } from 'express';
import { skillService } from './service.ts';
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
    service: 'skill-management-service',
    timestamp: new Date().toISOString(),
  });
});

router.get('/catalog', asyncHandler(async (req: any, res: Response) => {
  const skills = await skillService.getAllCatalogSkills(req.query.category as string);
  res.json(skills);
}));

router.get('/categories', asyncHandler(async (_req: any, res: Response) => {
  const cats = await skillService.getCategories();
  res.json(cats);
}));

router.post('/catalog', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const { name, category, description } = req.body;
  const skill = await skillService.createCatalogSkill(name, category, description);
  res.json(skill);
}));

router.get('/my-skills', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const skills = await skillService.getUserSkills(req.user!.userId);
  res.json(skills);
}));

router.post('/my-skills', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userSkill = await skillService.addUserSkill(req.user!.userId, req.body);
  res.json(userSkill);
}));

router.put('/my-skills/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userSkill = await skillService.updateUserSkill(req.user!.userId, req.params.id, req.body);
  res.json(userSkill);
}));

router.delete('/my-skills/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await skillService.deleteUserSkill(req.user!.userId, req.params.id);
  res.json(result);
}));

// Learning Journey
router.get('/learning-journey', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const records = await skillService.getLearningRecords(req.user!.userId);
  res.json(records);
}));

router.post('/learning-journey', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const record = await skillService.addLearningRecord(req.user!.userId, req.body);
  res.json(record);
}));

router.put('/learning-journey/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const record = await skillService.updateLearningRecord(req.user!.userId, req.params.id, req.body);
  res.json(record);
}));

router.delete('/learning-journey/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await skillService.deleteLearningRecord(req.user!.userId, req.params.id);
  res.json(result);
}));

router.post('/verify-certificate', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { learningRecordId, approve } = req.body;
  const result = await skillService.verifyCertificate(req.user!.userId, learningRecordId, Boolean(approve));
  res.json(result);
}));

// Internal inter-service endpoint
router.get('/internal/user-skills/:userId', asyncHandler(async (req: any, res: Response) => {
  const skills = await skillService.getUserSkills(req.params.userId);
  res.json(skills);
}));

export default router;
