import { Router, Response } from 'express';
import { aiAgentService } from './service.ts';

const router = Router();

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    res.status(err.status || 400).json({ error: err.message || 'An unexpected error occurred.' });
  });
};

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-agent-service',
    timestamp: new Date().toISOString(),
  });
});

router.post('/chat', asyncHandler(async (req: any, res: Response) => {
  const { prompt, conversationId, userLocation, userId } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt cannot be empty.' });
  }
  const result = await aiAgentService.processMessage(userId || null, conversationId || null, prompt, userLocation);
  res.json(result);
}));

router.get('/history/:convId', asyncHandler(async (req: any, res: Response) => {
  const history = await aiAgentService.getConversationHistory(req.params.convId);
  res.json(history);
}));

export default router;
