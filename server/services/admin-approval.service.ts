import { execute, queryAll, queryOne, transaction } from '../db/index.ts';
import { emailService } from './email.service.ts';

export class AdminApprovalService {
  async getPendingRegistrations() {
    const pending = queryAll<any>(
      `SELECT u.id, u.email, u.account_type, u.created_at, u.status,
              p.full_name, p.phone_number, p.bio, p.country, p.district, p.city, p.profile_photo_url,
              l.latitude, l.longitude, l.formatted_address
       FROM users u
       JOIN user_profiles p ON u.id = p.user_id
       LEFT JOIN user_locations l ON u.id = l.user_id
       WHERE u.status = 'PENDING'
       ORDER BY u.created_at DESC`
    );

    // Attach skills
    for (const user of pending) {
      const skills = queryAll<any>(
        `SELECT us.id, us.experience_level, us.description, s.name as skill_name, s.category
         FROM user_skills us
         JOIN skills s ON us.skill_id = s.id
         WHERE us.user_id = ?`,
        [user.id]
      );
      user.skills = skills;
    }

    return pending;
  }

  async getAllUsers(filters?: { status?: string; role?: string; type?: string; search?: string }) {
    let sql = `
      SELECT u.id, u.email, u.account_type, u.role_id, u.status, u.rejection_reason, u.created_at,
             p.full_name, p.phone_number, p.bio, p.city, p.district, p.profile_photo_url, p.membership_tier,
             p.rating_avg, p.rating_count, p.completed_services_count,
             w.available_credits, w.earned_credits, w.spent_credits
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN time_wallets w ON u.id = w.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND u.status = ?';
      params.push(filters.status);
    }
    if (filters?.role && filters.role !== 'ALL') {
      sql += ' AND u.role_id = ?';
      params.push(filters.role);
    }
    if (filters?.type && filters.type !== 'ALL') {
      sql += ' AND u.account_type = ?';
      params.push(filters.type);
    }
    if (filters?.search) {
      sql += ' AND (u.email LIKE ? OR p.full_name LIKE ? OR p.city LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY u.created_at DESC';
    return queryAll<any>(sql, params);
  }

  async approveUser(adminId: string, targetUserId: string, notes?: string) {
    const user = queryOne<any>(
      `SELECT u.id, u.email, u.status, p.full_name FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?`,
      [targetUserId]
    );

    if (!user) throw new Error('User not found.');
    if (user.status === 'APPROVED') {
      return { success: true, message: 'Account is already approved.' };
    }

    transaction(() => {
      // 1. Update status
      execute(
        `UPDATE users SET status = 'APPROVED', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [targetUserId]
      );

      // 2. Log in audit trail
      execute(
        `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details)
         VALUES (?, ?, 'APPROVE_USER', 'USER', ?, ?)`,
        ['LOG_' + Date.now(), adminId, targetUserId, `Approved registration for ${user.full_name} (${user.email}). Notes: ${notes || 'None'}`]
      );

      // 3. User notification
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'Registration Approved!', 'Congratulations! Your Time Bank membership has been approved by the administrator. 3.0 welcome credits are available in your wallet.', 'APPROVAL', '/dashboard')`,
        ['NOTIF_' + Date.now(), targetUserId]
      );
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    emailService.sendAccountApprovedEmail(user.email, user.full_name, appUrl).catch(err => console.error(err));

    return { success: true, message: `Account for ${user.full_name} has been approved successfully.` };
  }

  async rejectUser(adminId: string, targetUserId: string, reason: string) {
    const user = queryOne<any>(
      `SELECT u.id, u.email, p.full_name FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?`,
      [targetUserId]
    );

    if (!user) throw new Error('User not found.');

    transaction(() => {
      execute(
        `UPDATE users SET status = 'REJECTED', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [reason || 'Application details could not be verified.', targetUserId]
      );

      execute(
        `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details)
         VALUES (?, ?, 'REJECT_USER', 'USER', ?, ?)`,
        ['LOG_' + Date.now(), adminId, targetUserId, `Rejected registration. Reason: ${reason}`]
      );

      execute(
        `INSERT INTO notifications (id, user_id, title, content, type)
         VALUES (?, ?, 'Registration Application Rejected', ?, 'SYSTEM')`,
        ['NOTIF_' + Date.now(), targetUserId, `Your application was rejected: ${reason}`]
      );
    });

    emailService.sendAccountRejectedEmail(user.email, user.full_name, reason).catch(err => console.error(err));

    return { success: true, message: `Account for ${user.full_name} has been rejected.` };
  }

  async toggleSuspendUser(adminId: string, targetUserId: string, suspend: boolean, reason?: string) {
    const user = queryOne<any>(
      `SELECT u.id, u.email, u.role_id, p.full_name FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?`,
      [targetUserId]
    );

    if (!user) throw new Error('User not found.');
    if (user.role_id === 'SUPER_ADMIN') {
      throw new Error('Super Administrator accounts cannot be suspended.');
    }

    const newStatus = suspend ? 'SUSPENDED' : 'APPROVED';

    transaction(() => {
      execute(
        `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newStatus, targetUserId]
      );

      execute(
        `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details)
         VALUES (?, ?, ?, 'USER', ?, ?)`,
        [
          'LOG_' + Date.now(),
          adminId,
          suspend ? 'SUSPEND_USER' : 'REACTIVATE_USER',
          targetUserId,
          `${suspend ? 'Suspended' : 'Reactivated'} account for ${user.full_name}. Reason: ${reason || 'Administrative action'}`
        ]
      );
    });

    return {
      success: true,
      message: `Account for ${user.full_name} has been ${suspend ? 'suspended' : 'reactivated'}.`
    };
  }

  async getAuditLogs(limit = 100) {
    return queryAll<any>(
      `SELECT l.id, l.action, l.target_type, l.target_id, l.details, l.created_at,
              p.full_name as admin_name, u.email as admin_email
       FROM admin_logs l
       JOIN users u ON l.admin_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       ORDER BY l.created_at DESC
       LIMIT ?`,
      [limit]
    );
  }
}

export const adminApprovalService = new AdminApprovalService();
