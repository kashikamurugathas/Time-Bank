import { subscriptionsDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';

const logger = createLogger('subscription-service');

export class SubscriptionService {
  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    eventBus.subscribe('payment.completed', (data: any) => {
      try {
        if (data.planId) {
          const plan = subscriptionsDb.queryOne<any>('SELECT * FROM subscription_plans WHERE id = ?', [data.planId]);
          if (plan) {
            const endDate = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();
            const subId = `SUB_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

            subscriptionsDb.execute(
              `INSERT INTO subscriptions (id, user_id, plan_id, community_id, organization_id, status, end_date)
               VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)`,
              [subId, data.userId, data.planId, data.communityId || null, data.organizationId || null, endDate]
            );

            logger.info(`Activated subscription ${subId} for user ${data.userId} on plan ${plan.name}`);
          }
        }
      } catch (err: any) {
        logger.error(`Error activating subscription on payment.completed: ${err.message}`);
      }
    });
  }

  async getPlans() {
    const plans = subscriptionsDb.queryAll<any>('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_lkr ASC');
    return plans.map(p => ({
      ...p,
      features: JSON.parse(p.features_json || '[]'),
    }));
  }

  async getUserSubscription(userId: string) {
    const sub = subscriptionsDb.queryOne<any>(
      `SELECT s.*, p.name as plan_name, p.category as plan_category, p.price_lkr, p.features_json
       FROM subscriptions s
       JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'ACTIVE' AND s.end_date > CURRENT_TIMESTAMP
       ORDER BY s.created_at DESC LIMIT 1`,
      [userId]
    );

    if (!sub) return null;

    return {
      ...sub,
      features: JSON.parse(sub.features_json || '[]'),
    };
  }

  async updatePlan(adminId: string, planId: string, data: { name?: string; priceLkr?: number; features?: string[]; isActive?: boolean }) {
    subscriptionsDb.execute(
      `UPDATE subscription_plans
       SET name = COALESCE(?, name),
           price_lkr = COALESCE(?, price_lkr),
           features_json = COALESCE(?, features_json),
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.name,
        data.priceLkr,
        data.features ? JSON.stringify(data.features) : null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
        planId
      ]
    );

    return subscriptionsDb.queryOne('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
  }

  async cancelSubscription(userId: string) {
    subscriptionsDb.execute(
      `UPDATE subscriptions SET status = 'CANCELLED', auto_renew = 0 WHERE user_id = ? AND status = 'ACTIVE'`,
      [userId]
    );
    return { success: true, message: 'Your subscription renewal has been cancelled.' };
  }
}

export const subscriptionService = new SubscriptionService();
