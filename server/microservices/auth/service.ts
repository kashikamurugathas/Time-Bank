import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authDb } from './db.ts';
import { JWT_SECRET } from '../common/config.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { UserTokenPayload } from '../common/auth-middleware.ts';

const logger = createLogger('auth-service');

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
    const existing = authDb.queryOne('SELECT id FROM auth_users WHERE email = ?', [emailNorm]);
    if (existing) {
      throw new Error('An account with this email address already exists. Please log in or use a different email.');
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const userId = `USR_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Super Admin auto-approved, others start as PENDING
    const isSuperAdminEmail = emailNorm === 'kashikamurugathas@gmail.com';
    const initialStatus = isSuperAdminEmail ? 'APPROVED' : 'PENDING';
    const roleId = isSuperAdminEmail ? 'SUPER_ADMIN' : 'MEMBER';

    authDb.execute(
      `INSERT INTO auth_users (id, email, password_hash, account_type, role_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, emailNorm, passwordHash, data.accountType, roleId, initialStatus]
    );

    logger.info(`User registered successfully in Auth database: ${emailNorm} (${userId})`);

    // Publish event for User Management, Wallet, and Email Notification services
    eventBus.publish('user.registered', {
      userId,
      email: emailNorm,
      fullName: data.fullName,
      accountType: data.accountType,
      roleId,
      status: initialStatus,
      phoneNumber: data.phoneNumber,
      bio: data.bio,
      country: data.country || 'Sri Lanka',
      district: data.district,
      city: data.city,
      currentLocation: data.currentLocation,
      skills: data.skills,
      profilePhotoData: data.profilePhotoData,
    });

    const tokenPayload: UserTokenPayload = {
      userId,
      email: emailNorm,
      roleId,
      accountType: data.accountType,
      status: initialStatus,
      fullName: data.fullName,
      requiresPasswordChange: false,
    };

    const token = this.generateToken(tokenPayload);

    return {
      message: initialStatus === 'APPROVED'
        ? 'Registration successful! Welcome to Time Bank.'
        : 'Registration successful! Your account has been submitted for administrator review.',
      token,
      user: {
        id: userId,
        email: emailNorm,
        fullName: data.fullName,
        accountType: data.accountType,
        roleId,
        status: initialStatus,
      },
    };
  }

  async login(email: string, passwordPlain: string, rememberMe = false) {
    const emailNorm = email.trim().toLowerCase();
    const user = authDb.queryOne<any>('SELECT * FROM auth_users WHERE email = ?', [emailNorm]);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account temporarily locked due to multiple failed login attempts. Please try again later.');
    }

    const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      if (attempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      authDb.execute(
        'UPDATE auth_users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockUntil, user.id]
      );
      throw new Error('Invalid email or password.');
    }

    // Reset failed attempts on success
    authDb.execute('UPDATE auth_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);

    const tokenPayload: UserTokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      accountType: user.account_type,
      status: user.status,
      fullName: user.email.split('@')[0],
      requiresPasswordChange: Boolean(user.requires_password_change),
    };

    const token = this.generateToken(tokenPayload, rememberMe);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        roleId: user.role_id,
        accountType: user.account_type,
        status: user.status,
        requiresPasswordChange: Boolean(user.requires_password_change),
      },
    };
  }

  async changePassword(userId: string, currentPlain: string, newPlain: string) {
    if (newPlain.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const user = authDb.queryOne<any>('SELECT * FROM auth_users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found.');
    }

    const isValid = await bcrypt.compare(currentPlain, user.password_hash);
    if (!isValid) {
      throw new Error('Current password does not match.');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPlain, salt);

    authDb.execute(
      'UPDATE auth_users SET password_hash = ?, requires_password_change = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, userId]
    );

    eventBus.publish('auth.password_changed', { userId, email: user.email });

    return { message: 'Password updated successfully.' };
  }

  async forgotPassword(email: string) {
    const user = authDb.queryOne<any>('SELECT * FROM auth_users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return { message: 'If an account exists with this email, a password reset link has been dispatched.' };
    }

    const token = `RESET_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    authDb.execute(
      'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [`PR_${Date.now()}`, user.id, token, expiresAt]
    );

    eventBus.publish('auth.password_reset_requested', {
      userId: user.id,
      email: user.email,
      resetToken: token,
    });

    return { message: 'If an account exists with this email, a password reset link has been dispatched.', debugToken: token };
  }

  async resetPasswordWithToken(token: string, newPlain: string) {
    if (newPlain.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const reset = authDb.queryOne<any>(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    if (!reset) {
      throw new Error('Password reset token is invalid or has expired.');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPlain, salt);

    authDb.execute(
      'UPDATE auth_users SET password_hash = ?, requires_password_change = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, reset.user_id]
    );

    authDb.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);

    return { message: 'Password has been reset successfully. Please log in with your new credentials.' };
  }

  updateUserStatus(userId: string, status: string, rejectionReason?: string) {
    authDb.execute(
      'UPDATE auth_users SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, rejectionReason || null, userId]
    );
    logger.info(`Updated user ${userId} status to ${status} in Auth DB`);
  }
}

export const authService = new AuthService();
