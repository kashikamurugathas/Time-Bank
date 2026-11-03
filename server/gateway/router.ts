import { Router, Response } from 'express';
import { authService } from '../services/auth.service.ts';
import { userService } from '../services/user.service.ts';
import { adminApprovalService } from '../services/admin-approval.service.ts';
import { skillService } from '../services/skill.service.ts';
import { locationRecommendationService } from '../services/location-recommendation.service.ts';
import { helpRequestService } from '../services/help-request.service.ts';
import { bookingService } from '../services/booking.service.ts';
import { walletService } from '../services/wallet.service.ts';
import { messagingService } from '../services/messaging.service.ts';
import { subscriptionService } from '../services/subscription.service.ts';
import { paymentService } from '../services/payment.service.ts';
import { aiAgentService } from '../services/ai-agent.service.ts';
import { reviewService } from '../services/review.service.ts';
import { analyticsService } from '../services/analytics.service.ts';
import { authenticateToken, requireApproved, requireRole, AuthenticatedRequest } from './middleware.ts';
import { queryAll, execute } from '../db/index.ts';

const router = Router();

// Helper to catch async errors cleanly
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message);
    res.status(err.status || 400).json({ error: err.message || 'An unexpected error occurred.' });
  });
};

// ==========================================
// 1. AUTHENTICATION SERVICE ENDPOINTS
// ==========================================
router.post('/auth/register', asyncHandler(async (req: any, res: Response) => {
  const result = await authService.register(req.body);
  res.json(result);
}));

router.post('/auth/login', asyncHandler(async (req: any, res: Response) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const result = await authService.login(email, password, Boolean(rememberMe));
  res.json(result);
}));

router.post('/auth/change-password', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  res.json(result);
}));

router.post('/auth/forgot-password', asyncHandler(async (req: any, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  res.json(result);
}));

router.post('/auth/reset-password', asyncHandler(async (req: any, res: Response) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPasswordWithToken(token, newPassword);
  res.json(result);
}));

router.get('/auth/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await userService.getFullUserProfile(req.user!.userId);
  res.json({ user: profile });
}));

// ==========================================
// 2. USER MANAGEMENT SERVICE ENDPOINTS
// ==========================================
router.get('/users/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await userService.getFullUserProfile(req.user!.userId);
  res.json(profile);
}));

router.put('/users/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updated = await userService.updateProfile(req.user!.userId, req.body);
  res.json(updated);
}));

router.post('/users/profile-photo', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { photoData, mimeType } = req.body;
  const result = await userService.uploadProfilePicture(req.user!.userId, photoData, mimeType);
  res.json(result);
}));

router.delete('/users/profile-photo', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await userService.removeProfilePicture(req.user!.userId);
  res.json(result);
}));

router.get('/users/public/:id', asyncHandler(async (req: any, res: Response) => {
  const profile = await userService.getPublicProfile(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Member not found.' });
  res.json(profile);
}));

// ==========================================
// 3. ADMIN APPROVAL SERVICE ENDPOINTS
// ==========================================
router.get('/admin/pending-approvals', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const pending = await adminApprovalService.getPendingRegistrations();
  res.json(pending);
}));

router.get('/admin/users', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const users = await adminApprovalService.getAllUsers(req.query);
  res.json(users);
}));

router.post('/admin/approve-user', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, notes } = req.body;
  const result = await adminApprovalService.approveUser(req.user!.userId, userId, notes);
  res.json(result);
}));

router.post('/admin/reject-user', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, reason } = req.body;
  const result = await adminApprovalService.rejectUser(req.user!.userId, userId, reason);
  res.json(result);
}));

router.post('/admin/suspend-user', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, suspend, reason } = req.body;
  const result = await adminApprovalService.toggleSuspendUser(req.user!.userId, userId, Boolean(suspend), reason);
  res.json(result);
}));

router.get('/admin/audit-logs', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const logs = await adminApprovalService.getAuditLogs();
  res.json(logs);
}));

// ==========================================
// 4. SKILL MANAGEMENT SERVICE ENDPOINTS
// ==========================================
router.get('/skills/catalog', asyncHandler(async (req: any, res: Response) => {
  const skills = await skillService.getAllCatalogSkills(req.query.category as string);
  res.json(skills);
}));

router.get('/skills/categories', asyncHandler(async (req: any, res: Response) => {
  const cats = await skillService.getCategories();
  res.json(cats);
}));

router.post('/skills/catalog', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const { name, category, description } = req.body;
  const skill = await skillService.createCatalogSkill(name, category, description);
  res.json(skill);
}));

router.post('/skills/my-skills', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userSkill = await skillService.addUserSkill(req.user!.userId, req.body);
  res.json(userSkill);
}));

router.put('/skills/my-skills/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userSkill = await skillService.updateUserSkill(req.user!.userId, req.params.id, req.body);
  res.json(userSkill);
}));

router.delete('/skills/my-skills/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await skillService.deleteUserSkill(req.user!.userId, req.params.id);
  res.json(result);
}));

// My Learning Journey
router.post('/skills/learning-journey', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const record = await skillService.addLearningRecord(req.user!.userId, req.body);
  res.json(record);
}));

router.put('/skills/learning-journey/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const record = await skillService.updateLearningRecord(req.user!.userId, req.params.id, req.body);
  res.json(record);
}));

router.delete('/skills/learning-journey/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await skillService.deleteLearningRecord(req.user!.userId, req.params.id);
  res.json(result);
}));

router.post('/admin/verify-certificate', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { learningRecordId, approve } = req.body;
  const result = await skillService.verifyCertificate(req.user!.userId, learningRecordId, Boolean(approve));
  res.json(result);
}));

// ==========================================
// 5. LOCATION RECOMMENDATION SERVICE ENDPOINTS
// ==========================================
router.get('/location/nearby-helpers', asyncHandler(async (req: any, res: Response) => {
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

// ==========================================
// 6. HELP REQUEST MANAGEMENT SERVICE
// ==========================================
router.get('/requests', asyncHandler(async (req: any, res: Response) => {
  const requests = await helpRequestService.listRequests({
    status: req.query.status as string,
    category: req.query.category as string,
    requesterId: req.query.requesterId as string,
    search: req.query.search as string
  });
  res.json(requests);
}));

router.get('/requests/:id', asyncHandler(async (req: any, res: Response) => {
  const reqData = await helpRequestService.getRequestById(req.params.id);
  if (!reqData) return res.status(404).json({ error: 'Help request not found.' });
  res.json(reqData);
}));

router.post('/requests', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await helpRequestService.createRequest(req.user!.userId, req.body);
  res.json(result);
}));

router.post('/requests/:id/offers', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await helpRequestService.submitOffer(req.params.id, req.user!.userId, req.body);
  res.json(result);
}));

router.post('/requests/:id/accept-offer', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { offerId } = req.body;
  const result = await helpRequestService.acceptOffer(req.params.id, offerId, req.user!.userId);
  res.json(result);
}));

router.post('/requests/:id/cancel', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await helpRequestService.cancelRequest(req.params.id, req.user!.userId);
  res.json(result);
}));

// ==========================================
// 7. BOOKING & SCHEDULING SERVICE ENDPOINTS
// ==========================================
router.get('/bookings', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookings = await bookingService.getUserBookings(req.user!.userId, req.query.role as any);
  res.json(bookings);
}));

router.get('/bookings/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
}));

router.post('/bookings/direct', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.createDirectBooking(req.user!.userId, req.body);
  res.json(booking);
}));

router.post('/bookings/:id/confirm-completion', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await bookingService.confirmCompletion(req.params.id, req.user!.userId);
  res.json(result);
}));

router.post('/bookings/:id/reschedule', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { newDate, newTime, reason } = req.body;
  const result = await bookingService.rescheduleBooking(req.params.id, req.user!.userId, newDate, newTime, reason);
  res.json(result);
}));

router.post('/bookings/:id/accept-reschedule', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await bookingService.acceptReschedule(req.params.id, req.user!.userId);
  res.json(result);
}));

router.post('/bookings/:id/cancel', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const result = await bookingService.cancelBooking(req.params.id, req.user!.userId, reason);
  res.json(result);
}));

// ==========================================
// 8. TIME CREDIT WALLET SERVICE ENDPOINTS
// ==========================================
router.get('/wallet', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const wallet = await walletService.getWallet(req.user!.userId);
  res.json(wallet);
}));

router.post('/wallet/transfer', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { toUserId, amount, description } = req.body;
  const result = await walletService.transferCredits(req.user!.userId, toUserId, parseFloat(amount), undefined, description);
  res.json(result);
}));

router.get('/admin/transactions', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const txs = await walletService.getAllTransactions();
  res.json(txs);
}));

router.post('/admin/wallet-adjust', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId, amount, reason } = req.body;
  const result = await walletService.adminAdjustCredits(req.user!.userId, targetUserId, parseFloat(amount), reason);
  res.json(result);
}));

// ==========================================
// 9. MESSAGING SERVICE ENDPOINTS
// ==========================================
router.get('/messages/conversations', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const convs = await messagingService.getUserConversations(req.user!.userId);
  res.json(convs);
}));

router.get('/messages/conversations/:id', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const messages = await messagingService.getMessages(req.params.id, req.user!.userId);
  res.json(messages);
}));

router.post('/messages/send', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { recipientId, content, relatedBookingId } = req.body;
  const result = await messagingService.sendMessage(req.user!.userId, recipientId, content, relatedBookingId);
  res.json(result);
}));

router.get('/messages/unread-count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const count = await messagingService.getUnreadCount(req.user!.userId);
  res.json({ count });
}));

// ==========================================
// NOTIFICATIONS ENDPOINTS
// ==========================================
router.get('/notifications', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notifs = queryAll<any>(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [req.user!.userId]
  );
  res.json(notifs);
}));

router.post('/notifications/:id/read', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  execute(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user!.userId]);
  res.json({ success: true });
}));

router.post('/notifications/read-all', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user!.userId]);
  res.json({ success: true });
}));

// ==========================================
// 10 & 11. SUBSCRIPTION MANAGEMENT SERVICE
// ==========================================
router.get('/subscriptions/plans', asyncHandler(async (req: any, res: Response) => {
  const plans = await subscriptionService.getPlans();
  res.json(plans);
}));

router.get('/subscriptions/my-subscription', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sub = await subscriptionService.getUserSubscription(req.user!.userId);
  res.json(sub);
}));

router.put('/admin/plans/:id', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updated = await subscriptionService.updatePlan(req.user!.userId, req.params.id, req.body);
  res.json(updated);
}));

router.post('/subscriptions/cancel', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await subscriptionService.cancelSubscription(req.user!.userId);
  res.json(result);
}));

// ==========================================
// 12. PAYMENT SERVICE ENDPOINTS
// ==========================================
router.post('/payments/initiate', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { planId, communityId, organizationId } = req.body;
  const checkoutPayload = await paymentService.initiatePayment(req.user!.userId, planId, communityId, organizationId);
  res.json(checkoutPayload);
}));

router.post('/payments/process', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await paymentService.processPayment(req.user!.userId, req.body);
  res.json(result);
}));

router.get('/payments/my-payments', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payments = await paymentService.getUserPayments(req.user!.userId);
  res.json(payments);
}));

router.get('/admin/payments', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
  const payments = await paymentService.getAllPayments();
  res.json(payments);
}));

// ==========================================
// 13. AI AGENT - TIME BANK ASSISTANT
// ==========================================
router.post('/ai/chat', asyncHandler(async (req: any, res: Response) => {
  const { prompt, conversationId, userLocation, userId } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt cannot be empty.' });
  }
  const result = await aiAgentService.processMessage(userId || null, conversationId || null, prompt, userLocation);
  res.json(result);
}));

router.get('/ai/history/:convId', asyncHandler(async (req: any, res: Response) => {
  const history = await aiAgentService.getConversationHistory(req.params.convId);
  res.json(history);
}));

// ==========================================
// 14. REVIEW AND RATING SERVICE ENDPOINTS
// ==========================================
router.post('/reviews', authenticateToken, requireApproved, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId, rating, comment } = req.body;
  const review = await reviewService.createReview(req.user!.userId, bookingId, rating, comment);
  res.json(review);
}));

router.get('/reviews/user/:id', asyncHandler(async (req: any, res: Response) => {
  const reviews = await reviewService.getUserReviews(req.params.id);
  res.json(reviews);
}));

// ==========================================
// 15. ANALYTICS AND REPORTING SERVICE ENDPOINTS
// ==========================================
router.get('/analytics/community-impact', asyncHandler(async (req: any, res: Response) => {
  const impact = await analyticsService.getCommunityImpactSummary();
  res.json(impact);
}));

router.get('/admin/platform-report', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), asyncHandler(async (req: any, res: Response) => {
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
