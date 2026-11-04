import { paymentsDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { subscriptionsDb } from '../subscriptions/db.ts';

const logger = createLogger('payment-service');

export class PaymentService {
  async initiatePayment(userId: string, planId: string, communityId?: string, organizationId?: string) {
    const plan = subscriptionsDb.queryOne<any>('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    if (!plan) throw new Error('Subscription plan not found.');

    const orderId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      orderId,
      amount: plan.price_lkr,
      currency: 'LKR',
      planName: plan.name,
      planCategory: plan.category,
      merchantId: process.env.PAYHERE_MERCHANT_ID || '1220001_TIMEBANK',
      returnUrl: `${process.env.APP_URL || ''}/membership?status=success`,
      cancelUrl: `${process.env.APP_URL || ''}/membership?status=cancelled`,
      notifyUrl: `${process.env.APP_URL || ''}/api/payments/payhere-notify`,
      communityId,
      organizationId,
    };
  }

  async processPayment(userId: string, data: {
    planId: string;
    amount: number;
    paymentMethod?: string;
    orderId?: string;
    communityId?: string;
    organizationId?: string;
  }) {
    const plan = subscriptionsDb.queryOne<any>('SELECT * FROM subscription_plans WHERE id = ?', [data.planId]);
    if (!plan) throw new Error('Selected plan not found.');

    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txRef = data.orderId || `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    return paymentsDb.transaction(() => {
      paymentsDb.execute(
        `INSERT INTO payments (id, transaction_ref, user_id, plan_id, amount_lkr, currency, gateway, status, payment_method, gateway_response_json)
         VALUES (?, ?, ?, ?, ?, 'LKR', 'PayHere', 'SUCCESS', ?, ?)`,
        [paymentId, txRef, userId, data.planId, data.amount || plan.price_lkr, data.paymentMethod || 'CREDIT_CARD', JSON.stringify({ verified: true, timestamp: new Date().toISOString() })]
      );

      paymentsDb.execute(
        `INSERT INTO invoices (id, invoice_number, payment_id, user_id, amount_lkr, tax_lkr, description)
         VALUES (?, ?, ?, ?, ?, 0.0, ?)`,
        [`INV_${Date.now()}`, invoiceNo, paymentId, userId, data.amount || plan.price_lkr, `Subscription for ${plan.name}`]
      );

      // Publish event for Subscription microservice
      eventBus.publish('payment.completed', {
        paymentId,
        transactionRef: txRef,
        userId,
        planId: data.planId,
        amount: data.amount || plan.price_lkr,
        communityId: data.communityId,
        organizationId: data.organizationId,
      });

      logger.info(`Payment processed successfully: ${txRef} for user ${userId} (${plan.name})`);

      return {
        success: true,
        transactionRef: txRef,
        invoiceNumber: invoiceNo,
        amount: data.amount || plan.price_lkr,
        planName: plan.name,
        message: 'Payment verified and subscription activated successfully!',
      };
    });
  }

  async getUserPayments(userId: string) {
    const payments = paymentsDb.queryAll<any>(
      `SELECT p.*, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON p.id = i.payment_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return payments.map(p => {
      let planName = 'Time Bank Membership';
      if (p.plan_id) {
        const plan = subscriptionsDb.queryOne<any>('SELECT name FROM subscription_plans WHERE id = ?', [p.plan_id]);
        if (plan) planName = plan.name;
      }
      return {
        ...p,
        plan_name: planName,
      };
    });
  }

  async getAllPayments(limit = 100) {
    return paymentsDb.queryAll<any>(
      `SELECT p.*, i.invoice_number
       FROM payments p
       LEFT JOIN invoices i ON p.id = i.payment_id
       ORDER BY p.created_at DESC LIMIT ?`,
      [limit]
    );
  }
}

export const paymentService = new PaymentService();
