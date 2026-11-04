import nodemailer, { Transporter } from 'nodemailer';
import { emailDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { usersDb } from '../users/db.ts';

const logger = createLogger('email-notification-service');

export class EmailNotificationService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
    this.registerEventHandlers();
  }

  private initTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        logger.info('SMTP transporter configured with host ' + process.env.SMTP_HOST);
      } catch (err: any) {
        logger.warn(`Could not initialize real SMTP transport: ${err.message}. Using simulated mode.`);
      }
    }
  }

  private registerEventHandlers() {
    // 1. User registered
    eventBus.subscribe('user.registered', async (data: any) => {
      await this.sendNotification(
        data.userId,
        'Welcome to Time Bank!',
        `Your account has been created with 3.0 welcome credits. ${data.status === 'PENDING' ? 'An administrator will review your account shortly.' : 'Your account is active!'}`,
        'REGISTRATION'
      );
      await this.sendEmail(
        data.email,
        'Welcome to Time Bank Platform',
        'WELCOME',
        `Hello ${data.fullName},\n\nWelcome to Time Bank! Your account has been registered with 3 starter time credits. One hour of your service equals one credit to exchange across our community.`
      );
    });

    // 2. User approved
    eventBus.subscribe('user.approved', async (data: any) => {
      const user = usersDb.queryOne<any>('SELECT email FROM user_accounts WHERE id = ?', [data.userId]);
      await this.sendNotification(
        data.userId,
        'Account Approved!',
        'Congratulations! Your Time Bank membership has been verified and approved by the community administrator.',
        'APPROVAL'
      );
      if (user?.email) {
        await this.sendEmail(
          user.email,
          'Your Time Bank Account Is Approved!',
          'APPROVAL',
          `Congratulations! Your membership application has been reviewed and approved. You now have full access to request help, offer skills, and exchange time credits.`
        );
      }
    });

    // 3. User rejected
    eventBus.subscribe('user.rejected', async (data: any) => {
      const user = usersDb.queryOne<any>('SELECT email FROM user_accounts WHERE id = ?', [data.userId]);
      await this.sendNotification(
        data.userId,
        'Registration Status Update',
        `Your registration was not approved. Reason: ${data.reason}`,
        'REGISTRATION'
      );
      if (user?.email) {
        await this.sendEmail(
          user.email,
          'Time Bank Registration Status',
          'REJECTION',
          `Thank you for your interest in Time Bank. At this time, your application was not approved. Reason provided: ${data.reason}`
        );
      }
    });

    // 4. Booking created
    eventBus.subscribe('booking.created', async (data: any) => {
      await this.sendNotification(
        data.helperId,
        'New Confirmed Booking',
        `You have a confirmed service session for "${data.skillName}" on ${data.serviceDate} at ${data.serviceTime}.`,
        'BOOKING'
      );
      await this.sendNotification(
        data.requesterId,
        'Booking Confirmed',
        `Your booking ${data.bookingCode} for "${data.skillName}" has been scheduled for ${data.serviceDate} at ${data.serviceTime}.`,
        'BOOKING'
      );
    });

    // 5. Booking completed
    eventBus.subscribe('booking.completed', async (data: any) => {
      await this.sendNotification(
        data.helperId,
        'Time Credits Received!',
        `You earned ${data.amountCredits} credit(s) for completing the session "${data.skillName}". Please leave a review!`,
        'CREDIT'
      );
      await this.sendNotification(
        data.requesterId,
        'Session Completed',
        `Your service session for "${data.skillName}" was marked complete. Please share your rating and review.`,
        'BOOKING'
      );
    });

    // 6. Direct Message Sent
    eventBus.subscribe('message.sent', async (data: any) => {
      await this.sendNotification(
        data.recipientId,
        `New Message from ${data.senderName}`,
        data.content.length > 60 ? `${data.content.substring(0, 60)}...` : data.content,
        'MESSAGE',
        `/dashboard`
      );
    });

    // 7. Credit Transferred
    eventBus.subscribe('credit.transferred', async (data: any) => {
      await this.sendNotification(
        data.toUserId,
        'Credits Received',
        `You received ${data.amount} Time Credit(s) (Ref: ${data.referenceNo}).`,
        'CREDIT'
      );
    });
  }

  async sendEmail(recipientEmail: string, subject: string, templateType: string, bodyText: string) {
    const id = `EML_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || 'Time Bank Community <community@timebank.lk>',
          to: recipientEmail,
          subject,
          text: bodyText,
        });
        emailDb.execute(
          `INSERT INTO email_logs (id, recipient_email, subject, template_type, status) VALUES (?, ?, ?, ?, 'SENT')`,
          [id, recipientEmail, subject, templateType]
        );
        logger.info(`Email successfully dispatched to ${recipientEmail}`);
        return { success: true, status: 'SENT' };
      } catch (err: any) {
        emailDb.execute(
          `INSERT INTO email_logs (id, recipient_email, subject, template_type, status, error_message) VALUES (?, ?, ?, ?, 'FAILED', ?)`,
          [id, recipientEmail, subject, templateType, err.message]
        );
        logger.error(`Failed to dispatch SMTP email to ${recipientEmail}: ${err.message}`);
        return { success: false, status: 'FAILED' };
      }
    } else {
      // High-fidelity simulated email logged into database
      emailDb.execute(
        `INSERT INTO email_logs (id, recipient_email, subject, template_type, status) VALUES (?, ?, ?, ?, 'SIMULATED')`,
        [id, recipientEmail, subject, templateType]
      );
      logger.info(`[Email Simulated] Subject: "${subject}" to <${recipientEmail}>`);
      return { success: true, status: 'SIMULATED' };
    }
  }

  async sendNotification(userId: string, title: string, content: string, type: string, linkUrl?: string) {
    const id = `NOTIF_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    emailDb.execute(
      `INSERT INTO notifications (id, user_id, title, content, type, link_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, title, content, type, linkUrl || null]
    );
  }

  async getUserNotifications(userId: string) {
    return emailDb.queryAll<any>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
  }

  async markNotificationRead(id: string, userId: string) {
    emailDb.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    return { success: true };
  }

  async markAllRead(userId: string) {
    emailDb.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    return { success: true };
  }

  async getEmailLogs(limit = 100) {
    return emailDb.queryAll<any>(
      'SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT ?',
      [limit]
    );
  }
}

export const emailService = new EmailNotificationService();
