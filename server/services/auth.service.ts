import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { execute, queryOne, transaction } from '../db/index.ts';
import { emailService } from './email.service.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'timebank_community_jwt_secret_key_2026_secure';

export interface UserTokenPayload {
  userId: string;
  email: string;
  roleId: string;
  accountType: string;
  status: string;
  fullName: string;
  requiresPasswordChange: boolean;
}

export class AuthService {
  generateToken(payload: UserTokenPayload, rememberMe = false): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: rememberMe ? '30d' : '7d',
    });
  }

  verifyToken(token: string): UserTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    } catch {
      return null;
    }
  }

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    phoneNumber?: string;
    country?: string;
    district?: string;
    city?: string;
    currentLocation?: { lat: number; lng: number; address?: string };
    skills?: Array<{ skillId?: string; skillName: string; level: string; description?: string }>;
    bio?: string;
    accountType: 'INDIVIDUAL' | 'COMMUNITY' | 'ORGANIZATION';
    profilePhotoData?: string;
  }) {
    const emailNorm = data.email.trim().toLowerCase();

    // Check duplicate
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [emailNorm]);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in or use a different email.');
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters in length.');
    }

    const userId = 'USR_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const passwordHash = bcrypt.hashSync(data.password, 10);

    const lat = data.currentLocation?.lat ?? 9.6749; // Default Jaffna / Sri Lanka if not provided
    const lng = data.currentLocation?.lng ?? 80.0292;
    const address = data.currentLocation?.address || `${data.city || 'Jaffna'}, ${data.district || 'Jaffna'}, ${data.country || 'Sri Lanka'}`;

    transaction(() => {
      // 1. Insert user with MANDATORY PENDING status
      execute(
        `INSERT INTO users (id, email, password_hash, account_type, role_id, status, requires_password_change)
         VALUES (?, ?, ?, ?, 'MEMBER', 'PENDING', 0)`,
        [userId, emailNorm, passwordHash, data.accountType]
      );

      // 2. Insert profile
      execute(
        `INSERT INTO user_profiles (user_id, full_name, phone_number, bio, country, district, city, profile_photo_url, membership_tier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'FREE')`,
        [
          userId,
          data.fullName.trim(),
          data.phoneNumber || null,
          data.bio || 'New Time Bank member eager to share and learn skills.',
          data.country || 'Sri Lanka',
          data.district || 'Jaffna',
          data.city || 'Nallur',
          data.profilePhotoData || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
        ]
      );

      // 3. Save profile photo record if custom
      if (data.profilePhotoData && data.profilePhotoData.startsWith('data:image')) {
        const photoId = 'PHOTO_' + Date.now();
        execute(
          `INSERT INTO profile_photos (id, user_id, filename, mime_type, size_bytes, data_base64)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [photoId, userId, 'avatar.png', 'image/png', data.profilePhotoData.length, data.profilePhotoData]
        );
      }

      // 4. Save location coordinates
      execute(
        `INSERT INTO user_locations (user_id, latitude, longitude, formatted_address, city, district)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, lat, lng, address, data.city || 'Nallur', data.district || 'Jaffna']
      );

      // 5. Initialize time wallet with 3.0 initial welcome credits
      execute(
        `INSERT INTO time_wallets (user_id, available_credits, earned_credits, spent_credits)
         VALUES (?, 3.0, 0.0, 0.0)`,
        [userId]
      );

      // 6. Register initial skills if specified
      if (data.skills && Array.isArray(data.skills)) {
        for (const s of data.skills) {
          if (!s.skillName) continue;
          let skillRecord = queryOne('SELECT id FROM skills WHERE name = ? COLLATE NOCASE', [s.skillName]);
          let skillId = skillRecord?.id;
          if (!skillId) {
            skillId = 'SKILL_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            execute(
              `INSERT INTO skills (id, name, category, description) VALUES (?, ?, 'General Skills', ?)`,
              [skillId, s.skillName, s.description || s.skillName]
            );
          }
          const userSkillId = 'USK_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          const level = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(s.level?.toUpperCase())
            ? s.level.toUpperCase()
            : 'INTERMEDIATE';

          execute(
            `INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, experience_level, description, hourly_rate_credits, availability_status)
             VALUES (?, ?, ?, ?, ?, 1.0, 'AVAILABLE')`,
            [userSkillId, userId, skillId, level, s.description || `Offers ${s.skillName} sessions`]
          );
        }
      }

      // 7. Create in-app notification for Administrators
      const adminUsers = queryOne<{ id: string }>('SELECT id FROM users WHERE role_id IN ("SUPER_ADMIN", "ADMIN") LIMIT 1');
      if (adminUsers?.id) {
        execute(
          `INSERT INTO notifications (id, user_id, title, content, type, link_url)
           VALUES (?, ?, ?, ?, 'REGISTRATION', '/admin/approvals')`,
          [
            'NOTIF_' + Date.now(),
            adminUsers.id,
            'New Member Registration Pending Approval',
            `${data.fullName} (${data.email}) registered as ${data.accountType} in ${data.city || 'Jaffna'}. Please review and approve.`,
            '/admin/approvals'
          ]
        );
      }
    });

    // Send confirmation email to applicant informing them of pending status
    emailService.sendRegistrationPendingEmail(emailNorm, data.fullName).catch(err => console.error(err));

    return {
      success: true,
      status: 'PENDING',
      message: 'Your registration is pending administrator approval. You will be able to log in once the admin verifies and approves your account.'
    };
  }

  async login(email: string, pass: string, rememberMe = false) {
    const emailNorm = email.trim().toLowerCase();
    const user = queryOne<any>(
      `SELECT u.id, u.email, u.password_hash, u.account_type, u.role_id, u.status, u.requires_password_change,
              u.failed_login_attempts, u.locked_until,
              p.full_name, p.profile_photo_url, p.membership_tier
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.email = ?`,
      [emailNorm]
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again shortly.');
    }

    const passwordMatch = bcrypt.compareSync(pass, user.password_hash);
    if (!passwordMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockSql = 'UPDATE users SET failed_login_attempts = ? WHERE id = ?';
      let lockParams: any[] = [attempts, user.id];

      if (attempts >= 5) {
        const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        lockSql = 'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?';
        lockParams = [attempts, lockTime, user.id];
      }
      execute(lockSql, lockParams);
      throw new Error('Invalid email or password.');
    }

    // Reset failed login attempts on successful credentials
    execute('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);

    // Mandatory Admin Approval Enforcement
    if (user.status === 'PENDING') {
      throw new Error('Your registration is pending administrator approval. Please wait for an approval email before logging in.');
    }

    if (user.status === 'REJECTED') {
      throw new Error('Your registration was not approved. Please contact the administrator for more information.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Your account has been suspended by administration. Please contact support.');
    }

    const tokenPayload: UserTokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      accountType: user.account_type,
      status: user.status,
      fullName: user.full_name || 'Member',
      requiresPasswordChange: Boolean(user.requires_password_change)
    };

    const token = this.generateToken(tokenPayload, rememberMe);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        accountType: user.account_type,
        status: user.status,
        membershipTier: user.membership_tier,
        profilePhotoUrl: user.profile_photo_url,
        requiresPasswordChange: Boolean(user.requires_password_change)
      }
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    if (newPass.length < 6) {
      throw new Error('New password must be at least 6 characters in length.');
    }

    const user = queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('User not found.');

    const match = bcrypt.compareSync(currentPass, user.password_hash);
    if (!match) {
      throw new Error('Current password does not match our records.');
    }

    const newHash = bcrypt.hashSync(newPass, 10);
    execute(
      `UPDATE users SET password_hash = ?, requires_password_change = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newHash, userId]
    );

    return { success: true, message: 'Password updated successfully.' };
  }

  async forgotPassword(email: string) {
    const user = queryOne<any>(
      `SELECT u.id, u.email, p.full_name FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );
    if (!user) {
      // Return vague message for security
      return { success: true, message: 'If this email is registered, you will receive password reset instructions.' };
    }

    const resetToken = jwt.sign({ userId: user.id, type: 'pwd_reset' }, JWT_SECRET, { expiresIn: '1h' });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    await emailService.sendPasswordResetEmail(user.email, user.full_name || 'Member', resetUrl);

    return { success: true, message: 'Password reset link sent to registered email address.' };
  }

  async resetPasswordWithToken(token: string, newPass: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
      if (decoded.type !== 'pwd_reset' || !decoded.userId) {
        throw new Error('Invalid or expired reset token.');
      }
      if (newPass.length < 6) {
        throw new Error('New password must be at least 6 characters in length.');
      }
      const newHash = bcrypt.hashSync(newPass, 10);
      execute(
        `UPDATE users SET password_hash = ?, requires_password_change = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newHash, decoded.userId]
      );
      return { success: true, message: 'Password has been reset successfully. You can now log in.' };
    } catch {
      throw new Error('Invalid or expired password reset token.');
    }
  }
}

export const authService = new AuthService();
