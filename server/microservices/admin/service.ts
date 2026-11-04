import { adminDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { authService } from '../auth/service.ts';
import { userService } from '../users/service.ts';

const logger = createLogger('admin-approval-service');

export class AdminApprovalService {
  async logAction(adminId: string, action: string, targetType: string, targetId?: string, details?: string, ipAddress?: string) {
    adminDb.execute(
      `INSERT INTO admin_logs (id, admin_id, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, adminId, action, targetType, targetId || null, details || null, ipAddress || '127.0.0.1']
    );
  }

  async getPendingRegistrations() {
    return userService.getAllUsersForAdmin({ status: 'PENDING' });
  }

  async getAllUsers(filters?: any) {
    return userService.getAllUsersForAdmin(filters);
  }

  async approveUser(adminId: string, targetUserId: string, notes?: string) {
    // 1. Update Auth Service
    authService.updateUserStatus(targetUserId, 'APPROVED');

    // 2. Update User Management Service
    userService.updateUserStatus(targetUserId, 'APPROVED');

    // 3. Log to Admin DB
    await this.logAction(adminId, 'USER_APPROVED', 'USER', targetUserId, notes || 'Account approved by administrator.');

    // 4. Publish Event for Notification & Email microservices
    eventBus.publish('user.approved', {
      userId: targetUserId,
      adminId,
      notes,
    });

    logger.info(`User ${targetUserId} approved by admin ${adminId}`);
    return { success: true, message: 'Member account has been approved and activated.' };
  }

  async rejectUser(adminId: string, targetUserId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is required.');
    }

    // 1. Update Auth Service
    authService.updateUserStatus(targetUserId, 'REJECTED', reason);

    // 2. Update User Management Service
    userService.updateUserStatus(targetUserId, 'REJECTED');

    // 3. Log to Admin DB
    await this.logAction(adminId, 'USER_REJECTED', 'USER', targetUserId, `Reason: ${reason}`);

    // 4. Publish Event
    eventBus.publish('user.rejected', {
      userId: targetUserId,
      adminId,
      reason,
    });

    logger.info(`User ${targetUserId} rejected by admin ${adminId}: ${reason}`);
    return { success: true, message: 'Registration has been rejected and applicant notified.' };
  }

  async toggleSuspendUser(adminId: string, targetUserId: string, suspend: boolean, reason?: string) {
    const status = suspend ? 'SUSPENDED' : 'APPROVED';

    authService.updateUserStatus(targetUserId, status, reason);
    userService.updateUserStatus(targetUserId, status);

    await this.logAction(
      adminId,
      suspend ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      'USER',
      targetUserId,
      reason || (suspend ? 'User suspended' : 'User reinstated')
    );

    eventBus.publish('user.status_changed', {
      userId: targetUserId,
      status,
      adminId,
      reason,
    });

    return { success: true, message: `Account has been ${suspend ? 'suspended' : 'reinstated'}.` };
  }

  async getAuditLogs(limit = 100) {
    return adminDb.queryAll(
      `SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }
}

export const adminApprovalService = new AdminApprovalService();
