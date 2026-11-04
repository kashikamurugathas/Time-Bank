import { walletDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';

const logger = createLogger('time-credit-wallet-service');

export class WalletService {
  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    // Grant welcome credits on new registration
    eventBus.subscribe('user.registered', (data: any) => {
      try {
        const existing = walletDb.queryOne('SELECT user_id FROM wallets WHERE user_id = ?', [data.userId]);
        if (!existing) {
          walletDb.execute(
            `INSERT INTO wallets (user_id, available_credits, earned_credits, spent_credits, pending_credits)
             VALUES (?, 3.0, 0.0, 0.0, 0.0)`,
            [data.userId]
          );

          const txId = `TX_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          walletDb.execute(
            `INSERT INTO time_transactions (id, reference_no, from_user_id, to_user_id, amount_credits, transaction_type, description, status)
             VALUES (?, ?, NULL, ?, 3.0, 'BONUS', 'Welcome to Time Bank! 3 hours starter credit gift', 'COMPLETED')`,
            [txId, `REF-BONUS-${Date.now()}`, data.userId]
          );

          logger.info(`Initialized wallet with 3.0 bonus credits for user ${data.userId}`);
        }
      } catch (err: any) {
        logger.error(`Error creating wallet on user.registered: ${err.message}`);
      }
    });

    // Handle completed booking credit transfer
    eventBus.subscribe('booking.completed', (data: any) => {
      try {
        this.transferCredits(
          data.requesterId,
          data.helperId,
          data.amountCredits,
          data.bookingId,
          `Service completion for booking ${data.bookingCode}: ${data.skillName}`
        );
        logger.info(`Transferred ${data.amountCredits} credits from ${data.requesterId} to ${data.helperId} for booking ${data.bookingId}`);
      } catch (err: any) {
        logger.error(`Error processing booking.completed in Wallet Service: ${err.message}`);
      }
    });
  }

  ensureWallet(userId: string) {
    let wallet = walletDb.queryOne<any>('SELECT * FROM wallets WHERE user_id = ?', [userId]);
    if (!wallet) {
      walletDb.execute(
        `INSERT INTO wallets (user_id, available_credits, earned_credits, spent_credits, pending_credits)
         VALUES (?, 3.0, 0.0, 0.0, 0.0)`,
        [userId]
      );
      wallet = walletDb.queryOne<any>('SELECT * FROM wallets WHERE user_id = ?', [userId]);
    }
    return wallet;
  }

  async getWallet(userId: string) {
    const wallet = this.ensureWallet(userId);
    const transactions = walletDb.queryAll<any>(
      `SELECT * FROM time_transactions
       WHERE from_user_id = ? OR to_user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [userId, userId]
    );

    return {
      availableCredits: wallet.available_credits,
      earnedCredits: wallet.earned_credits,
      spentCredits: wallet.spent_credits,
      pendingCredits: wallet.pending_credits,
      transactions: transactions.map(t => ({
        ...t,
        direction: t.to_user_id === userId ? 'INCOMING' : 'OUTGOING',
      })),
    };
  }

  async transferCredits(fromUserId: string, toUserId: string, amount: number, relatedBookingId?: string, description?: string) {
    if (amount <= 0) throw new Error('Transfer amount must be positive.');
    if (fromUserId === toUserId) throw new Error('Cannot transfer credits to yourself.');

    const senderWallet = this.ensureWallet(fromUserId);
    this.ensureWallet(toUserId);

    if (senderWallet.available_credits < amount) {
      throw new Error(`Insufficient time credits. You have ${senderWallet.available_credits} credits available, but ${amount} credits are required.`);
    }

    return walletDb.transaction(() => {
      // Deduct from sender
      walletDb.execute(
        `UPDATE wallets
         SET available_credits = available_credits - ?,
             spent_credits = spent_credits + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, amount, fromUserId]
      );

      // Add to recipient
      walletDb.execute(
        `UPDATE wallets
         SET available_credits = available_credits + ?,
             earned_credits = earned_credits + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, amount, toUserId]
      );

      const refNo = `TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const txId = `TX_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      walletDb.execute(
        `INSERT INTO time_transactions (id, reference_no, from_user_id, to_user_id, amount_credits, transaction_type, related_booking_id, description, status)
         VALUES (?, ?, ?, ?, ?, 'TRANSFER', ?, ?, 'COMPLETED')`,
        [txId, refNo, fromUserId, toUserId, amount, relatedBookingId || null, description || 'Peer-to-peer time credit transfer']
      );

      eventBus.publish('credit.transferred', {
        fromUserId,
        toUserId,
        amount,
        referenceNo: refNo,
      });

      return {
        success: true,
        referenceNo: refNo,
        amountTransferred: amount,
        message: `Successfully transferred ${amount} Time Credit(s).`,
      };
    });
  }

  async adminAdjustCredits(adminId: string, targetUserId: string, amount: number, reason: string) {
    this.ensureWallet(targetUserId);

    walletDb.execute(
      `UPDATE wallets
       SET available_credits = MAX(0, available_credits + ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [amount, targetUserId]
    );

    const refNo = `ADJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = `TX_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    walletDb.execute(
      `INSERT INTO time_transactions (id, reference_no, from_user_id, to_user_id, amount_credits, transaction_type, description, status)
       VALUES (?, ?, NULL, ?, ?, 'ADMIN_ADJUSTMENT', ?, 'COMPLETED')`,
      [txId, refNo, targetUserId, Math.abs(amount), `Admin Adjustment by ${adminId}: ${reason}`]
    );

    return { success: true, message: `Adjusted balance by ${amount} credit(s).` };
  }

  async getAllTransactions(limit = 100) {
    return walletDb.queryAll<any>(
      `SELECT * FROM time_transactions ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }
}

export const walletService = new WalletService();
