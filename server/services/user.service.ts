import { execute, queryAll, queryOne, transaction } from '../db/index.ts';

export class UserService {
  async getFullUserProfile(userId: string) {
    const user = queryOne<any>(
      `SELECT u.id, u.email, u.account_type, u.role_id, u.status, u.requires_password_change, u.created_at,
              p.full_name, p.phone_number, p.bio, p.country, p.district, p.city, p.address_privacy,
              p.profile_photo_url, p.membership_tier, p.rating_avg, p.rating_count, p.completed_services_count,
              l.latitude, l.longitude, l.formatted_address, l.search_radius_km,
              w.available_credits, w.earned_credits, w.spent_credits, w.pending_credits
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       LEFT JOIN user_locations l ON u.id = l.user_id
       LEFT JOIN time_wallets w ON u.id = w.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) return null;

    // Fetch user skills
    const skills = queryAll<any>(
      `SELECT us.id, us.skill_id, us.experience_level, us.description, us.hourly_rate_credits,
              us.availability_status, us.preferred_locations, us.is_verified, us.work_samples,
              s.name as skill_name, s.category
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = ?
       ORDER BY us.is_verified DESC, s.name ASC`,
      [userId]
    );

    // Fetch learning journey records
    const learningJourney = queryAll<any>(
      `SELECT id, skill_name, category, status, progress_percentage, description,
              learning_institution, completion_date, certificate_url, project_image_url,
              work_samples, is_verified_by_admin, created_at
       FROM learning_records
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    // Fetch recent notifications count
    const unreadNotifications = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    )?.count || 0;

    return {
      ...user,
      skills,
      learningJourney,
      unreadNotifications
    };
  }

  async getPublicProfile(targetUserId: string) {
    const profile = queryOne<any>(
      `SELECT u.id, u.account_type, u.created_at,
              p.full_name, p.bio, p.country, p.district, p.city, p.profile_photo_url,
              p.membership_tier, p.rating_avg, p.rating_count, p.completed_services_count,
              p.address_privacy, l.city as loc_city, l.district as loc_district
       FROM users u
       JOIN user_profiles p ON u.id = p.user_id
       LEFT JOIN user_locations l ON u.id = l.user_id
       WHERE u.id = ? AND u.status = 'APPROVED'`,
      [targetUserId]
    );

    if (!profile) return null;

    const skills = queryAll<any>(
      `SELECT us.id, us.experience_level, us.description, us.availability_status, us.is_verified,
              s.name as skill_name, s.category
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = ?`,
      [targetUserId]
    );

    const verifiedLearnings = queryAll<any>(
      `SELECT id, skill_name, category, status, progress_percentage, description, completion_date, is_verified_by_admin
       FROM learning_records
       WHERE user_id = ? AND (status = 'VERIFIED' OR is_verified_by_admin = 1)`,
      [targetUserId]
    );

    const reviews = queryAll<any>(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              p.full_name as reviewer_name, p.profile_photo_url as reviewer_photo
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [targetUserId]
    );

    return {
      ...profile,
      skills,
      verifiedLearnings,
      reviews
    };
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    phoneNumber?: string;
    bio?: string;
    district?: string;
    city?: string;
    addressPrivacy?: 'APPROXIMATE' | 'CITY_ONLY' | 'PUBLIC';
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    searchRadiusKm?: number;
  }) {
    transaction(() => {
      execute(
        `UPDATE user_profiles
         SET full_name = COALESCE(?, full_name),
             phone_number = COALESCE(?, phone_number),
             bio = COALESCE(?, bio),
             district = COALESCE(?, district),
             city = COALESCE(?, city),
             address_privacy = COALESCE(?, address_privacy),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          data.fullName?.trim() || null,
          data.phoneNumber?.trim() || null,
          data.bio?.trim() || null,
          data.district?.trim() || null,
          data.city?.trim() || null,
          data.addressPrivacy || null,
          userId
        ]
      );

      if (data.latitude !== undefined && data.longitude !== undefined) {
        execute(
          `INSERT INTO user_locations (user_id, latitude, longitude, formatted_address, city, district, search_radius_km)
           VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, 25.0))
           ON CONFLICT(user_id) DO UPDATE SET
             latitude = excluded.latitude,
             longitude = excluded.longitude,
             formatted_address = COALESCE(excluded.formatted_address, user_locations.formatted_address),
             city = COALESCE(excluded.city, user_locations.city),
             district = COALESCE(excluded.district, user_locations.district),
             search_radius_km = COALESCE(excluded.search_radius_km, user_locations.search_radius_km),
             updated_at = CURRENT_TIMESTAMP`,
          [
            userId,
            data.latitude,
            data.longitude,
            data.formattedAddress || null,
            data.city || null,
            data.district || null,
            data.searchRadiusKm || 25.0
          ]
        );
      }
    });

    return this.getFullUserProfile(userId);
  }

  async uploadProfilePicture(userId: string, base64Data: string, mimeType = 'image/jpeg') {
    // Validate size (< 5MB base64)
    if (base64Data.length > 7 * 1024 * 1024) {
      throw new Error('Image file is too large. Please upload an image under 5MB.');
    }

    if (!base64Data.startsWith('data:image/')) {
      throw new Error('Invalid image format. Supported formats: JPG, JPEG, PNG, WebP.');
    }

    const photoId = 'PHOTO_' + Date.now();
    transaction(() => {
      execute(
        `INSERT INTO profile_photos (id, user_id, filename, mime_type, size_bytes, data_base64)
         VALUES (?, ?, 'profile.jpg', ?, ?, ?)`,
        [photoId, userId, mimeType, base64Data.length, base64Data]
      );

      execute(
        `UPDATE user_profiles SET profile_photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [base64Data, userId]
      );
    });

    return { success: true, profilePhotoUrl: base64Data };
  }

  async removeProfilePicture(userId: string) {
    const defaultPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
    transaction(() => {
      execute('DELETE FROM profile_photos WHERE user_id = ?', [userId]);
      execute('UPDATE user_profiles SET profile_photo_url = ? WHERE user_id = ?', [defaultPhoto, userId]);
    });
    return { success: true, profilePhotoUrl: defaultPhoto };
  }
}

export const userService = new UserService();
