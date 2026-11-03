const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('timebank_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('timebank_token', token);
}

export function removeStoredToken() {
  localStorage.removeItem('timebank_token');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  changePassword: (body: any) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // User Profile
  getProfile: () => request('/users/profile'),
  updateProfile: (body: any) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  uploadProfilePhoto: (photoData: string, mimeType?: string) => request('/users/profile-photo', { method: 'POST', body: JSON.stringify({ photoData, mimeType }) }),
  removeProfilePhoto: () => request('/users/profile-photo', { method: 'DELETE' }),
  getPublicProfile: (id: string) => request(`/users/public/${id}`),

  // Admin
  getPendingApprovals: () => request('/admin/pending-approvals'),
  getAllUsers: (params?: any) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/users${q}`);
  },
  approveUser: (userId: string, notes?: string) => request('/admin/approve-user', { method: 'POST', body: JSON.stringify({ userId, notes }) }),
  rejectUser: (userId: string, reason: string) => request('/admin/reject-user', { method: 'POST', body: JSON.stringify({ userId, reason }) }),
  suspendUser: (userId: string, suspend: boolean, reason?: string) => request('/admin/suspend-user', { method: 'POST', body: JSON.stringify({ userId, suspend, reason }) }),
  getAuditLogs: () => request('/admin/audit-logs'),
  getAdminReport: () => request('/admin/platform-report'),
  getAllTransactions: () => request('/admin/transactions'),
  adjustWallet: (targetUserId: string, amount: number, reason: string) => request('/admin/wallet-adjust', { method: 'POST', body: JSON.stringify({ targetUserId, amount, reason }) }),
  verifyCertificate: (learningRecordId: string, approve: boolean) => request('/admin/verify-certificate', { method: 'POST', body: JSON.stringify({ learningRecordId, approve }) }),

  // Skills
  getCatalogSkills: (category?: string) => request(`/skills/catalog${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getCategories: () => request('/skills/categories'),
  createCatalogSkill: (body: any) => request('/skills/catalog', { method: 'POST', body: JSON.stringify(body) }),
  addUserSkill: (body: any) => request('/skills/my-skills', { method: 'POST', body: JSON.stringify(body) }),
  updateUserSkill: (id: string, body: any) => request(`/skills/my-skills/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUserSkill: (id: string) => request(`/skills/my-skills/${id}`, { method: 'DELETE' }),

  // Learning Journey
  addLearningRecord: (body: any) => request('/skills/learning-journey', { method: 'POST', body: JSON.stringify(body) }),
  updateLearningRecord: (id: string, body: any) => request(`/skills/learning-journey/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLearningRecord: (id: string) => request(`/skills/learning-journey/${id}`, { method: 'DELETE' }),

  // Location & Recommendations
  getNearbyHelpers: (params: { lat: number; lng: number; radius?: number; skillId?: string; category?: string; search?: string; excludeUserId?: string }) => {
    const q = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      ...(params.radius ? { radius: params.radius.toString() } : {}),
      ...(params.skillId ? { skillId: params.skillId } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.excludeUserId ? { excludeUserId: params.excludeUserId } : {})
    });
    return request(`/location/nearby-helpers?${q.toString()}`);
  },

  // Help Requests
  getRequests: (params?: any) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/requests${q}`);
  },
  getRequestById: (id: string) => request(`/requests/${id}`),
  createRequest: (body: any) => request('/requests', { method: 'POST', body: JSON.stringify(body) }),
  submitOffer: (requestId: string, body: any) => request(`/requests/${requestId}/offers`, { method: 'POST', body: JSON.stringify(body) }),
  acceptOffer: (requestId: string, offerId: string) => request(`/requests/${requestId}/accept-offer`, { method: 'POST', body: JSON.stringify({ offerId }) }),
  cancelRequest: (requestId: string) => request(`/requests/${requestId}/cancel`, { method: 'POST' }),

  // Bookings
  getBookings: (role?: string) => request(`/bookings${role ? `?role=${role}` : ''}`),
  getBookingById: (id: string) => request(`/bookings/${id}`),
  createDirectBooking: (body: any) => request('/bookings/direct', { method: 'POST', body: JSON.stringify(body) }),
  confirmCompletion: (id: string) => request(`/bookings/${id}/confirm-completion`, { method: 'POST' }),
  rescheduleBooking: (id: string, body: any) => request(`/bookings/${id}/reschedule`, { method: 'POST', body: JSON.stringify(body) }),
  acceptReschedule: (id: string) => request(`/bookings/${id}/accept-reschedule`, { method: 'POST' }),
  cancelBooking: (id: string, reason: string) => request(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Wallet
  getWallet: () => request('/wallet'),
  transferCredits: (body: any) => request('/wallet/transfer', { method: 'POST', body: JSON.stringify(body) }),

  // Messaging
  getConversations: () => request('/messages/conversations'),
  getMessages: (convId: string) => request(`/messages/conversations/${convId}`),
  sendMessage: (body: any) => request('/messages/send', { method: 'POST', body: JSON.stringify(body) }),
  getUnreadCount: () => request('/messages/unread-count'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Subscriptions & Payment
  getPlans: () => request('/subscriptions/plans'),
  getMySubscription: () => request('/subscriptions/my-subscription'),
  updatePlan: (id: string, body: any) => request(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancelSubscription: () => request('/subscriptions/cancel', { method: 'POST' }),
  initiatePayment: (body: any) => request('/payments/initiate', { method: 'POST', body: JSON.stringify(body) }),
  processPayment: (body: any) => request('/payments/process', { method: 'POST', body: JSON.stringify(body) }),
  getMyPayments: () => request('/payments/my-payments'),
  getAllPayments: () => request('/admin/payments'),

  // AI Agent
  chatWithAi: (body: { prompt: string; conversationId?: string; userLocation?: any; userId?: string }) => request('/ai/chat', { method: 'POST', body: JSON.stringify(body) }),
  getAiHistory: (convId: string) => request(`/ai/history/${convId}`),

  // Reviews
  createReview: (body: any) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getUserReviews: (userId: string) => request(`/reviews/user/${userId}`),

  // Analytics & Community
  getCommunityImpact: () => request('/analytics/community-impact'),
  getCommunityDetails: (id: string) => request(`/communities/${id}`),
  getOrganizationDetails: (id: string) => request(`/organizations/${id}`),
};
