export interface ServiceConfig {
  name: string;
  port: number;
  baseUrl: string;
  dbFileName: string;
}

export const SERVICES: Record<string, ServiceConfig> = {
  gateway: {
    name: 'api-gateway',
    port: parseInt(process.env.GATEWAY_PORT || '3000', 10),
    baseUrl: process.env.GATEWAY_URL || 'http://localhost:3000',
    dbFileName: '',
  },
  auth: {
    name: 'auth-service',
    port: parseInt(process.env.AUTH_SERVICE_PORT || '5001', 10),
    baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    dbFileName: 'auth.db',
  },
  users: {
    name: 'user-service',
    port: parseInt(process.env.USER_SERVICE_PORT || '5002', 10),
    baseUrl: process.env.USER_SERVICE_URL || 'http://localhost:5002',
    dbFileName: 'users.db',
  },
  admin: {
    name: 'admin-approval-service',
    port: parseInt(process.env.ADMIN_SERVICE_PORT || '5003', 10),
    baseUrl: process.env.ADMIN_SERVICE_URL || 'http://localhost:5003',
    dbFileName: 'admin.db',
  },
  skills: {
    name: 'skill-management-service',
    port: parseInt(process.env.SKILL_SERVICE_PORT || '5004', 10),
    baseUrl: process.env.SKILL_SERVICE_URL || 'http://localhost:5004',
    dbFileName: 'skills.db',
  },
  location: {
    name: 'location-recommendation-service',
    port: parseInt(process.env.LOCATION_SERVICE_PORT || '5005', 10),
    baseUrl: process.env.LOCATION_SERVICE_URL || 'http://localhost:5005',
    dbFileName: 'location.db',
  },
  requests: {
    name: 'help-request-service',
    port: parseInt(process.env.REQUEST_SERVICE_PORT || '5006', 10),
    baseUrl: process.env.REQUEST_SERVICE_URL || 'http://localhost:5006',
    dbFileName: 'requests.db',
  },
  bookings: {
    name: 'booking-scheduling-service',
    port: parseInt(process.env.BOOKING_SERVICE_PORT || '5007', 10),
    baseUrl: process.env.BOOKING_SERVICE_URL || 'http://localhost:5007',
    dbFileName: 'bookings.db',
  },
  wallet: {
    name: 'time-credit-wallet-service',
    port: parseInt(process.env.WALLET_SERVICE_PORT || '5008', 10),
    baseUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:5008',
    dbFileName: 'wallet.db',
  },
  messaging: {
    name: 'messaging-service',
    port: parseInt(process.env.MESSAGING_SERVICE_PORT || '5009', 10),
    baseUrl: process.env.MESSAGING_SERVICE_URL || 'http://localhost:5009',
    dbFileName: 'messages.db',
  },
  email: {
    name: 'email-notification-service',
    port: parseInt(process.env.EMAIL_SERVICE_PORT || '5010', 10),
    baseUrl: process.env.EMAIL_SERVICE_URL || 'http://localhost:5010',
    dbFileName: 'email.db',
  },
  subscriptions: {
    name: 'subscription-service',
    port: parseInt(process.env.SUBSCRIPTION_SERVICE_PORT || '5011', 10),
    baseUrl: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:5011',
    dbFileName: 'subscriptions.db',
  },
  payments: {
    name: 'payment-service',
    port: parseInt(process.env.PAYMENT_SERVICE_PORT || '5012', 10),
    baseUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5012',
    dbFileName: 'payments.db',
  },
  ai: {
    name: 'ai-agent-service',
    port: parseInt(process.env.AI_SERVICE_PORT || '5013', 10),
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:5013',
    dbFileName: 'ai.db',
  },
  reviews: {
    name: 'review-rating-service',
    port: parseInt(process.env.REVIEW_SERVICE_PORT || '5014', 10),
    baseUrl: process.env.REVIEW_SERVICE_URL || 'http://localhost:5014',
    dbFileName: 'reviews.db',
  },
  analytics: {
    name: 'analytics-reporting-service',
    port: parseInt(process.env.ANALYTICS_SERVICE_PORT || '5015', 10),
    baseUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5015',
    dbFileName: 'analytics.db',
  },
};

export const JWT_SECRET = process.env.JWT_SECRET || 'timebank_community_jwt_secret_key_2026_secure';
