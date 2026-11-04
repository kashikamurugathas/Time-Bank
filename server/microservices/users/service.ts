import { usersDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';

const logger = createLogger('user-service');

export class UserService {
  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    // When a user is registered via Auth service, create their user account and profile
    eventBus.subscribe('user.registered', (data: any) => {
      try {
        usersDb.execute(
          `INSERT OR REPLACE INTO user_accounts (id, email, account_type, role_id, status)
           VALUES (?, ?, ?, ?, ?)`,
          [data.userId, data.email, data.accountType, data.roleId, data.status]
        );

        usersDb.execute(
          `INSERT OR REPLACE INTO user_profiles (user_id, full_name, phone_number, bio, country, district, city)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [data.userId, data.fullName, data.phoneNumber || null, data.bio || null, data.country || 'Sri Lanka', data.district || null, data.city || null]
        );

        if (data.profilePhotoData) {
          const photoId = `PH_${Date.now()}`;
          usersDb.execute(
            `INSERT OR REPLACE INTO profile_photos (id, user_id, filename, mime_type, size_bytes, data_base64)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [photoId, data.userId, 'avatar.png', 'image/png', data.profilePhotoData.length, data.profilePhotoData]
          );
          usersDb.execute('UPDATE user_profiles SET profile_photo_url = ? WHERE user_id = ?', [data.profilePhotoData, data.userId]);
        }

        logger.info(`User profile initialized via event for ${data.userId}`);
      } catch (err: any) {
        logger.error(`Failed to handle user.registered event in User Service: ${err.message}`);
      }
    });

    // When review completed, update rating average
    eventBus.subscribe('review.created', (data: any) => {
      try {
        const stats = usersDb.queryOne<any>(
          'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewed_user_id = ?',
          [data.reviewedUserId]
        );
        if (stats) {
          usersDb.execute(
            'UPDATE user_profiles SET rating_avg = ?, rating_count = ? WHERE user_id = ?',
            [Math.round((stats.avg_rating || 5.0) * 10) / 10, stats.count || 0, data.reviewedUserId]
          );
        }
      } catch (err: any) {
        logger.error(`Failed to update rating in User Service: ${err.message}`);
      }
    });
  }

  async getFullUserProfile(userId: string) {
    const account = usersDb.queryOne<any>('SELECT * FROM user_accounts WHERE id = ?', [userId]);
    if (!account) {
      throw new Error('User not found.');
    }

    const profile = usersDb.queryOne<any>('SELECT * FROM user_profiles WHERE user_id = ?', [userId]) || {
      user_id: userId,
      full_name: account.email.split('@')[0],
      membership_tier: 'FREE',
      rating_avg: 5.0,
      rating_count: 0,
      completed_services_count: 0,
    };

    return {
      id: account.id,
      email: account.email,
      accountType: account.account_type,
      roleId: account.role_id,
      status: account.status,
      createdAt: account.created_at,
      profile: {
        fullName: profile.full_name,
        phoneNumber: profile.phone_number,
        bio: profile.bio,
        country: profile.country || 'Sri Lanka',
        district: profile.district,
        city: profile.city,
        addressPrivacy: profile.address_privacy || 'APPROXIMATE',
        profilePhotoUrl: profile.profile_photo_url,
        membershipTier: profile.membership_tier,
        ratingAvg: profile.rating_avg,
        ratingCount: profile.rating_count,
        completedServicesCount: profile.completed_services_count,
      },
    };
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    phoneNumber?: string;
    bio?: string;
    district?: string;
    city?: string;
    country?: string;
    addressPrivacy?: 'APPROXIMATE' | 'CITY_ONLY' | 'PUBLIC';
  }) {
    const existing = usersDb.queryOne('SELECT user_id FROM user_profiles WHERE user_id = ?', [userId]);
    if (!existing) {
      usersDb.execute(
        `INSERT INTO user_profiles (user_id, full_name, phone_number, bio, district, city, country, address_privacy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, data.fullName || 'User', data.phoneNumber || null, data.bio || null, data.district || null, data.city || null, data.country || 'Sri Lanka', data.addressPrivacy || 'APPROXIMATE']
      );
    } else {
      usersDb.execute(
        `UPDATE user_profiles
         SET full_name = COALESCE(?, full_name),
             phone_number = COALESCE(?, phone_number),
             bio = COALESCE(?, bio),
             district = COALESCE(?, district),
             city = COALESCE(?, city),
             country = COALESCE(?, country),
             address_privacy = COALESCE(?, address_privacy),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [data.fullName, data.phoneNumber, data.bio, data.district, data.city, data.country, data.addressPrivacy, userId]
      );
    }

    eventBus.publish('user.profile_updated', { userId, ...data });

    return this.getFullUserProfile(userId);
  }

  async uploadProfilePicture(userId: string, base64Data: string, mimeType = 'image/jpeg') {
    if (!base64Data) {
      throw new Error('Photo data is required.');
    }

    const photoId = `PH_${Date.now()}`;
    const sizeBytes = Math.round((base64Data.length * 3) / 4);

    usersDb.execute(
      `INSERT OR REPLACE INTO profile_photos (id, user_id, filename, mime_type, size_bytes, data_base64)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [photoId, userId, `avatar_${userId}.jpg`, mimeType, sizeBytes, base64Data]
    );

    usersDb.execute(
      'UPDATE user_profiles SET profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [base64Data, userId]
    );

    return { photoUrl: base64Data, message: 'Profile photo updated successfully.' };
  }

  async removeProfilePicture(userId: string) {
    usersDb.execute('DELETE FROM profile_photos WHERE user_id = ?', [userId]);
    usersDb.execute('UPDATE user_profiles SET profile_photo_url = NULL WHERE user_id = ?', [userId]);
    return { message: 'Profile photo removed.' };
  }

  async getPublicProfile(userId: string) {
    const account = usersDb.queryOne<any>('SELECT id, account_type, status, role_id, created_at FROM user_accounts WHERE id = ?', [userId]);
    if (!account) return null;

    const profile = usersDb.queryOne<any>('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
    return {
      id: account.id,
      accountType: account.account_type,
      fullName: profile ? profile.full_name : 'Community Member',
      bio: profile ? profile.bio : '',
      city: profile ? profile.city : '',
      district: profile ? profile.district : '',
      country: profile ? profile.country : 'Sri Lanka',
      profilePhotoUrl: profile ? profile.profile_photo_url : null,
      ratingAvg: profile ? profile.rating_avg : 5.0,
      ratingCount: profile ? profile.rating_count : 0,
      completedServicesCount: profile ? profile.completed_services_count : 0,
      membershipTier: profile ? profile.membership_tier : 'FREE',
      memberSince: account.created_at,
    };
  }

  updateUserStatus(userId: string, status: string) {
    usersDb.execute('UPDATE user_accounts SET status = ? WHERE id = ?', [status, userId]);
    logger.info(`User ${userId} status updated to ${status} in User DB`);
  }

  getAllUsersForAdmin(filter?: { status?: string; search?: string }) {
    let sql = `
      SELECT u.id, u.email, u.account_type, u.role_id, u.status, u.created_at,
             p.full_name, p.phone_number, p.city, p.district, p.membership_tier, p.rating_avg, p.rating_count
      FROM user_accounts u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filter?.status && filter.status !== 'ALL') {
      sql += ' AND u.status = ?';
      params.push(filter.status);
    }
    if (filter?.search) {
      sql += ' AND (u.email LIKE ? OR p.full_name LIKE ? OR p.city LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY u.created_at DESC';
    return usersDb.queryAll(sql, params);
  }
}

export const userService = new UserService();
