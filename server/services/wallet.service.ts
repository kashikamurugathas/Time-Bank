import { execute, queryAll, queryOne, transaction } from '../db/index.ts';

export class TimeCreditWalletService {
  async getWallet(userId: string) {
    let wallet = queryOne<any>('SELECT * FROM time_wallets WHERE user_id = ?', [userId]);
    if (!wallet) {
      execute(
        `INSERT INTO time_wallets (user_id, available_credits, earned_credits, spent_credits)
         VALUES (?, 3.0, 0.0, 0.0)`,
        [userId]
      );
      wallet = queryOne<any>('SELECT * FROM time_wallets WHERE user_id = ?', [userId]);
    }

    const transactions = queryAll<any>(
      `SELECT t.*,
              fu.email as from_email, fp.full_name as from_name,
              tu.email as to_email, tp.full_name as to_name
       FROM time_transactions t
       LEFT JOIN users fu ON t.from_user_id = fu.id
       LEFT JOIN user_profiles fp ON fu.id = fp.user_id
       LEFT JOIN users tu ON t.to_user_id = tu.id
       LEFT JOIN user_profiles tp ON tu.id = tp.user_id
       WHERE t.from_user_id = ? OR t.to_user_id = ?
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [userId, userId]
    );

    return {
      availableCredits: wallet.available_credits,
      earnedCredits: wallet.earned_credits,
      spentCredits: wallet.spent_credits,
      pendingCredits: wallet.pending_credits,
      updatedAt: wallet.updated_at,
      transactions
    };
  }

  // Transfer time credits between two users (e.g. on service completion)
  async transferCredits(fromUserId: string, toUserId: string, amount: number, relatedBookingId?: string, description?: string) {
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    return transaction(() => {
      // Prevent duplicate transfer for same booking
      if (relatedBookingId) {
        const existingTx = queryOne(
          `SELECT id FROM time_transactions WHERE related_booking_id = ? AND status = 'COMPLETED'`,
          [relatedBookingId]
        );
        if (existingTx) {
          throw new Error('Time credits have already been transferred for this booking session.');
        }
      }

      // Check sender wallet
      const senderWallet = queryOne<any>('SELECT * FROM time_wallets WHERE user_id = ?', [fromUserId]);
      if (!senderWallet || senderWallet.available_credits < amount) {
        throw new Error(`Insufficient time credits. Available: ${senderWallet?.available_credits ?? 0}, Required: ${amount}`);
      }

      // Deduct from sender
      execute(
        `UPDATE time_wallets
         SET available_credits = available_credits - ?,
             spent_credits = spent_credits + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, amount, fromUserId]
      );

      // Add to recipient
      execute(
        `UPDATE time_wallets
         SET available_credits = available_credits + ?,
             earned_credits = earned_credits + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, amount, toUserId]
      );

      const refNo = 'TX-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const txId = 'TX_' + Date.now();

      execute(
        `INSERT INTO time_transactions (id, reference_no, from_user_id, to_user_id, amount_credits, transaction_type, related_booking_id, description, status)
         VALUES (?, ?, ?, ?, ?, 'TRANSFER', ?, ?, 'COMPLETED')`,
        [txId, refNo, fromUserId, toUserId, amount, relatedBookingId || null, description || `Time credit transfer for service exchange`]
      );

      return {
        success: true,
        transactionId: txId,
        referenceNo: refNo,
        amount,
        senderNewBalance: senderWallet.available_credits - amount
      };
    });
  }

  // Admin adjustment / bonus
  async adminAdjustCredits(adminId: string, targetUserId: string, amount: number, reason: string) {
    return transaction(() => {
      const wallet = queryOne<any>('SELECT * FROM time_wallets WHERE user_id = ?', [targetUserId]);
      if (!wallet) throw new Error('Target user wallet not found.');

      if (wallet.available_credits + amount < 0) {
        throw new Error('Adjustment would result in negative credit balance.');
      }

      execute(
        `UPDATE time_wallets
         SET available_credits = available_credits + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [amount, targetUserId]
      );

      const refNo = 'ADJ-' + Date.now().toString(36).toUpperCase();
      const txId = 'TX_' + Date.now();

      execute(
        `INSERT INTO time_transactions (id, reference_no, from_user_id, to_user_id, amount_credits, transaction_type, description, status)
         VALUES (?, ?, NULL, ?, ?, 'ADMIN_ADJUSTMENT', ?, 'COMPLETED')`,
        [txId, refNo, targetUserId, Math.abs(amount), `Admin adjustment: ${reason}`]
      );

      execute(
        `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details)
         VALUES (?, ?, 'WALLET_ADJUST', 'USER', ?, ?)`,
        ['LOG_' + Date.now(), adminId, targetUserId, `Adjusted credits by ${amount}. Reason: ${reason}`]
      );

      return { success: true, referenceNo: refNo, newBalance: wallet.available_credits + amount };
    });
  }

  async getAllTransactions(limit = 100) {
    return queryAll<any>(
      `SELECT t.*,
              fp.full_name as from_name, fu.email as from_email,
              tp.full_name as to_name, tu.email as to_email
       FROM time_transactions t
       LEFT JOIN users fu ON t.from_user_id = fu.id
       LEFT JOIN user_profiles fp ON fu.id = fp.user_id
       LEFT JOIN users tu ON t.to_user_id = tu.id
       LEFT JOIN user_profiles tp ON tu.id = tp.user_id
       ORDER BY t.created_at DESC
       LIMIT ?`,
      [limit]
    );
  }
}

export const walletService = new TimeCreditWalletService();
