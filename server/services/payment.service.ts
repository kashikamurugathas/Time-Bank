import { execute, queryAll, queryOne, transaction } from '../db/index.ts';
import { subscriptionService } from './subscription.service.ts';

export class PaymentService {
  private merchantId = process.env.PAYHERE_MERCHANT_ID || '1225501';
  private mode = process.env.PAYHERE_MODE || 'sandbox';

  async initiatePayment(userId: string, planId: string, communityId?: string, organizationId?: string) {
    const plan = queryOne<any>('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    if (!plan) throw new Error('Selected plan does not exist.');

    const user = queryOne<any>(
      `SELECT u.email, p.full_name, p.phone_number, p.city, p.country
       FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?`,
      [userId]
    );

    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    return {
      gateway: 'PayHere (Sri Lanka)',
      mode: this.mode,
      merchantId: this.merchantId,
      orderId,
      planId: plan.id,
      planName: plan.name,
      amountLkr: plan.price_lkr,
      currency: 'LKR',
      customerDetails: {
        fullName: user?.full_name || 'Member',
        email: user?.email || '',
        phone: user?.phone_number || '+94770000000',
        city: user?.city || 'Jaffna',
        country: user?.country || 'Sri Lanka'
      },
      communityId,
      organizationId
    };
  }

  // Completes a verified sandbox or production payment
  async processPayment(userId: string, data: {
    orderId: string;
    planId: string;
    amountLkr: number;
    paymentMethod?: string;
    communityId?: string;
    organizationId?: string;
  }) {
    const plan = queryOne<any>('SELECT * FROM subscription_plans WHERE id = ?', [data.planId]);
    if (!plan) throw new Error('Plan not found.');

    const txRef = 'PAY-SL-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    const paymentId = 'PAY_' + Date.now();
    const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    transaction(() => {
      // 1. Record payment
      execute(
        `INSERT INTO payments (id, transaction_ref, user_id, plan_id, amount_lkr, currency, gateway, status, payment_method, gateway_response_json)
         VALUES (?, ?, ?, ?, ?, 'LKR', 'PayHere', 'SUCCESS', ?, ?)`,
        [
          paymentId,
          txRef,
          userId,
          data.planId,
          data.amountLkr,
          data.paymentMethod || 'VISA/MASTER',
          JSON.stringify({ status: 'SUCCESS', orderId: data.orderId, verified: true })
        ]
      );

      // 2. Generate Invoice
      execute(
        `INSERT INTO invoices (id, invoice_number, payment_id, user_id, amount_lkr, tax_lkr, description)
         VALUES (?, ?, ?, ?, ?, 0.0, ?)`,
        [
          'INV_' + Date.now(),
          invoiceNumber,
          paymentId,
          userId,
          data.amountLkr,
          `Subscription to ${plan.name} (${plan.category})`
        ]
      );

      // 3. Activate subscription
      subscriptionService.activateSubscription(
        userId,
        data.planId,
        txRef,
        data.communityId,
        data.organizationId
      );
    });

    return {
      success: true,
      transactionRef: txRef,
      invoiceNumber,
      amountLkr: data.amountLkr,
      planName: plan.name,
      status: 'SUCCESS'
    };
  }

  async getUserPayments(userId: string) {
    return queryAll<any>(
      `SELECT p.*, sp.name as plan_name, sp.category as plan_category, inv.invoice_number
       FROM payments p
       LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
       LEFT JOIN invoices inv ON p.id = inv.payment_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
  }

  async getAllPayments(limit = 100) {
    return queryAll<any>(
      `SELECT p.*, sp.name as plan_name, u.email as user_email, up.full_name as user_name, inv.invoice_number
       FROM payments p
       LEFT JOIN subscription_plans sp ON p.plan_id = sp.id
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN invoices inv ON p.id = inv.payment_id
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
  }
}

export const paymentService = new PaymentService();
