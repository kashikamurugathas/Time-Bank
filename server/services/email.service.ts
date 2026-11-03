import nodemailer, { Transporter } from 'nodemailer';
import { execute } from '../db/index.ts';

interface SendEmailOptions {
  to: string;
  subject: string;
  templateType: string;
  htmlContent: string;
}

class EmailNotificationService {
  private transporter: Transporter | null = null;
  private isConfigured = false;
  private fromAddress = process.env.SMTP_FROM || 'Time Bank Platform <notifications@timebank.community>';

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  async sendEmail({ to, subject, templateType, htmlContent }: SendEmailOptions): Promise<{ success: boolean; simulated: boolean; message: string }> {
    const logId = 'EMAIL_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // If SMTP is not actively configured with host/user/pass, log gracefully and save to DB
    if (!this.isConfigured || !this.transporter) {
      console.warn(`[SMTP Notice] Email to <${to}> with subject "${subject}" simulated. SMTP credentials not configured in environment.`);
      execute(
        `INSERT INTO email_logs (id, recipient_email, subject, template_type, status, error_message)
         VALUES (?, ?, ?, ?, 'SIMULATED', 'SMTP not configured in environment. Logged gracefully.')`,
        [logId, to, subject, templateType]
      );
      return { success: true, simulated: true, message: 'Email logged (SMTP simulation mode active).' };
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html: htmlContent
      });

      execute(
        `INSERT INTO email_logs (id, recipient_email, subject, template_type, status)
         VALUES (?, ?, ?, ?, 'SENT')`,
        [logId, to, subject, templateType]
      );
      return { success: true, simulated: false, message: 'Email dispatched successfully.' };
    } catch (err: any) {
      console.error(`[SMTP Error] Delivery failed to <${to}>:`, err.message);
      execute(
        `INSERT INTO email_logs (id, recipient_email, subject, template_type, status, error_message)
         VALUES (?, ?, ?, ?, 'FAILED', ?)`,
        [logId, to, subject, templateType, err.message]
      );
      return { success: false, simulated: false, message: `Failed to deliver email: ${err.message}` };
    }
  }

  // Email template builders with purple and white branding (#6C3FC5)
  private wrapTemplate(title: string, bodyContent: string, actionButton?: { text: string; url: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #F7F7FB; margin: 0; padding: 24px; color: #1E1B2E; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #EAE7F6; box-shadow: 0 10px 25px -5px rgba(108, 63, 197, 0.08); }
          .header { background: linear-gradient(135deg, #6C3FC5 0%, #452080 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
          .tagline { font-size: 13px; opacity: 0.9; margin-top: 6px; letter-spacing: 0.2px; }
          .body { padding: 32px 28px; line-height: 1.6; font-size: 15px; }
          .button { display: inline-block; background: #6C3FC5; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; font-size: 15px; }
          .footer { background: #F2ECFF; padding: 20px; text-align: center; font-size: 12px; color: #6D6980; }
          .highlight { background: #F2ECFF; border-left: 4px solid #6C3FC5; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">Time Bank</h1>
            <div class="tagline">Your Time Has Value. Share It. Earn It. Grow Together.</div>
          </div>
          <div class="body">
            <h2 style="color: #452080; margin-top: 0;">${title}</h2>
            ${bodyContent}
            ${actionButton ? `<div style="text-align: center;"><a href="${actionButton.url}" class="button">${actionButton.text}</a></div>` : ''}
          </div>
          <div class="footer">
            &copy; 2026 Time Bank Platform &bull; Building strong community time exchanges without money.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendRegistrationPendingEmail(to: string, userName: string) {
    const html = this.wrapTemplate(
      'Registration Received – Pending Admin Approval',
      `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for registering on <strong>Time Bank – Community Time Exchange Platform</strong>!</p>
      <div class="highlight">
        <strong>Important notice:</strong> Every newly registered account must be reviewed and approved by the platform administrator before full platform access is granted.
      </div>
      <p>Our administration team has been notified. You will receive an email as soon as your account has been approved.</p>
      <p>We appreciate your patience as we maintain a trusted, safe community of skill exchangers.</p>
      `
    );
    return this.sendEmail({ to, subject: 'Registration Received – Pending Approval on Time Bank', templateType: 'REGISTRATION_PENDING', htmlContent: html });
  }

  async sendAccountApprovedEmail(to: string, userName: string, appUrl: string) {
    const html = this.wrapTemplate(
      'Congratulations! Your Account Has Been Approved',
      `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Great news! The administrator has reviewed and <strong>approved your account</strong> on Time Bank.</p>
      <p>You can now log in with your registered email and password to start publishing skills, exploring nearby helpers, and exchanging time credits.</p>
      <div class="highlight">
        <strong>Welcome Bonus:</strong> You have been granted <strong>3.0 Time Credits</strong> in your wallet to get you started!
      </div>
      `,
      { text: 'Log In Now', url: `${appUrl}/login` }
    );
    return this.sendEmail({ to, subject: 'Welcome to Time Bank – Your Account is Approved!', templateType: 'ACCOUNT_APPROVED', htmlContent: html });
  }

  async sendAccountRejectedEmail(to: string, userName: string, reason?: string) {
    const html = this.wrapTemplate(
      'Registration Status Update',
      `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for your interest in Time Bank. After reviewing your registration submission, the administration team was unable to approve your account at this time.</p>
      ${reason ? `<div class="highlight"><strong>Reason:</strong> ${reason}</div>` : ''}
      <p>If you believe this was an error or wish to provide updated verification details, please reply to this notice or contact support.</p>
      `
    );
    return this.sendEmail({ to, subject: 'Update on your Time Bank Registration', templateType: 'ACCOUNT_REJECTED', htmlContent: html });
  }

  async sendNewHelpRequestEmail(to: string, helperName: string, reqDetails: { requesterName: string; service: string; description: string; location: string; dateTime: string; link: string }) {
    const html = this.wrapTemplate(
      'New Help Request on Time Bank',
      `
      <p>Hello <strong>${helperName}</strong>,</p>
      <p>A fellow community member has requested your skill!</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>Requester:</strong> ${reqDetails.requesterName}</p>
        <p style="margin: 4px 0;"><strong>Requested Service:</strong> ${reqDetails.service}</p>
        <p style="margin: 4px 0;"><strong>Approximate Location:</strong> ${reqDetails.location}</p>
        <p style="margin: 4px 0;"><strong>Preferred Date & Time:</strong> ${reqDetails.dateTime}</p>
        <p style="margin: 4px 0;"><strong>Details:</strong> ${reqDetails.description}</p>
      </div>
      <p>One hour of service equals one Time Credit for your wallet upon completion.</p>
      `,
      { text: 'View & Respond to Request', url: reqDetails.link }
    );
    return this.sendEmail({ to, subject: 'New Help Request on Time Bank', templateType: 'NEW_HELP_REQUEST', htmlContent: html });
  }

  async sendBookingConfirmationEmail(to: string, userName: string, bookingDetails: { partnerName: string; skill: string; date: string; time: string; location: string; bookingCode: string }) {
    const html = this.wrapTemplate(
      'Booking Confirmed!',
      `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your time exchange booking is confirmed!</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>Booking Reference:</strong> #${bookingDetails.bookingCode}</p>
        <p style="margin: 4px 0;"><strong>Exchange Partner:</strong> ${bookingDetails.partnerName}</p>
        <p style="margin: 4px 0;"><strong>Service:</strong> ${bookingDetails.skill}</p>
        <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${bookingDetails.date} at ${bookingDetails.time}</p>
        <p style="margin: 4px 0;"><strong>Location:</strong> ${bookingDetails.location}</p>
      </div>
      <p>Remember: Both members must confirm completion in the app before time credits are transferred.</p>
      `
    );
    return this.sendEmail({ to, subject: `Booking Confirmed: ${bookingDetails.skill} (#${bookingDetails.bookingCode})`, templateType: 'BOOKING_CONFIRMED', htmlContent: html });
  }

  async sendServiceCompletionEmail(to: string, userName: string, credits: number, newBalance: number) {
    const html = this.wrapTemplate(
      'Time Exchange Completed & Credits Transferred',
      `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Both exchange participants have confirmed completion of the service session.</p>
      <div class="highlight">
        <p style="margin: 4px 0;"><strong>Time Credits Transferred:</strong> ${credits.toFixed(1)} Credits</p>
        <p style="margin: 4px 0;"><strong>Your Updated Balance:</strong> ${newBalance.toFixed(1)} Credits</p>
      </div>
      <p>Thank you for contributing your time and strengthening our community network!</p>
      `
    );
    return this.sendEmail({ to, subject: 'Service Completed – Time Credits Transferred', templateType: 'SERVICE_COMPLETED', htmlContent: html });
  }

  async sendPasswordResetEmail(to: string, userName: string, resetLink: string) {
    const html = this.wrapTemplate(
      'Reset Your Time Bank Password',
      `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      `,
      { text: 'Reset Password', url: resetLink }
    );
    return this.sendEmail({ to, subject: 'Time Bank – Password Reset Instructions', templateType: 'PASSWORD_RESET', htmlContent: html });
  }
}

export const emailService = new EmailNotificationService();
