import { execute, queryAll, queryOne, transaction } from '../db/index.ts';

export class SubscriptionService {
  async getPlans() {
    const plans = queryAll<any>('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY category ASC, price_lkr ASC');
    return plans.map(p => ({
      ...p,
      features: JSON.parse(p.features_json || '[]')
    }));
  }

  async updatePlan(adminId: string, planId: string, data: { name?: string; priceLkr?: number; features?: string[]; isActive?: boolean }) {
    const plan = queryOne('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    if (!plan) throw new Error('Plan not found.');

    execute(
      `UPDATE subscription_plans
       SET name = COALESCE(?, name),
           price_lkr = COALESCE(?, price_lkr),
           features_json = CASE WHEN ? IS NOT NULL THEN ? ELSE features_json END,
           is_active = COALESCE(?, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        data.name || null,
        data.priceLkr ?? null,
        data.features ? 1 : null,
        data.features ? JSON.stringify(data.features) : null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
        planId
      ]
    );

    execute(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details)
       VALUES (?, ?, 'UPDATE_PLAN', 'PLAN', ?, ?)`,
      ['LOG_' + Date.now(), adminId, planId, `Updated plan ${planId} price to LKR ${data.priceLkr}`]
    );

    return queryOne('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
  }

  async getUserSubscription(userId: string) {
    const sub = queryOne<any>(
      `SELECT s.*, p.name as plan_name, p.category as plan_category, p.price_lkr, p.features_json
       FROM subscriptions s
       JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status = 'ACTIVE'
       ORDER BY s.end_date DESC
       LIMIT 1`,
      [userId]
    );

    if (!sub) return null;

    return {
      ...sub,
      features: JSON.parse(sub.features_json || '[]'),
      isExpired: new Date(sub.end_date).getTime() < Date.now()
    };
  }

  async activateSubscription(userId: string, planId: string, paymentRef: string, communityId?: string, organizationId?: string) {
    const plan = queryOne<any>('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    if (!plan) throw new Error('Subscription plan not found.');

    const subId = 'SUB_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + (plan.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();

    transaction(() => {
      // Cancel previous active subscription for same user/plan category
      execute(
        `UPDATE subscriptions SET status = 'CANCELLED' WHERE user_id = ? AND status = 'ACTIVE'`,
        [userId]
      );

      execute(
        `INSERT INTO subscriptions (id, user_id, plan_id, community_id, organization_id, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [subId, userId, planId, communityId || null, organizationId || null, startDate, endDate]
      );

      // If individual premium plan, update user_profiles membership_tier
      if (plan.category === 'PREMIUM_INDIVIDUAL') {
        execute(
          `UPDATE user_profiles SET membership_tier = 'PREMIUM', updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
          [userId]
        );
      }

      // If community plan, update community
      if (communityId) {
        const tier = plan.id === 'PLAN_COMMUNITY_PLUS' ? 'PLUS' : 'BASIC';
        execute(`UPDATE communities SET plan_tier = ? WHERE id = ?`, [tier, communityId]);
      }

      // If organization plan, update organization
      if (organizationId) {
        const tier = plan.id === 'PLAN_ORG_PREMIUM' ? 'PREMIUM' : 'STANDARD';
        execute(`UPDATE organizations SET plan_tier = ? WHERE id = ?`, [tier, organizationId]);
      }

      // In-app notification
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'Subscription Activated', ?, 'SUBSCRIPTION', '/membership')`,
        [
          'NOTIF_' + Date.now(),
          userId,
          `Your subscription to ${plan.name} has been successfully activated until ${endDate.split('T')[0]}.`,
          '/membership'
        ]
      );
    });

    return {
      success: true,
      subscriptionId: subId,
      planName: plan.name,
      endDate
    };
  }

  async cancelSubscription(userId: string) {
    const sub = queryOne<any>('SELECT * FROM subscriptions WHERE user_id = ? AND status = ' + "'ACTIVE'", [userId]);
    if (!sub) throw new Error('No active subscription found.');

    transaction(() => {
      execute(`UPDATE subscriptions SET status = 'CANCELLED' WHERE id = ?`, [sub.id]);
      execute(`UPDATE user_profiles SET membership_tier = 'FREE' WHERE user_id = ?`, [userId]);
    });

    return { success: true, message: 'Subscription cancelled. You will continue on the Free tier.' };
  }
}

export const subscriptionService = new SubscriptionService();
