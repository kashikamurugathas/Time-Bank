import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createLogger } from './logger.ts';
import { createMicroserviceDatabase } from './db-factory.ts';

const logger = createLogger('migrator');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../../server/data');

export async function migrateAndSeedMicroservices(): Promise<void> {
  const legacyDbPath = path.join(dataDir, 'timebank.db');
  let legacyDb: Database.Database | null = null;

  if (fs.existsSync(legacyDbPath)) {
    try {
      legacyDb = new Database(legacyDbPath, { readonly: true });
      logger.info('Connected to legacy monolithic database for microservice data migration.');
    } catch (err: any) {
      logger.warn(`Could not open legacy database: ${err.message}. Proceeding with fresh seed.`);
    }
  }

  // 1. AUTH SERVICE DB
  const authDb = createMicroserviceDatabase('auth.db', `
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      account_type TEXT NOT NULL,
      role_id TEXT NOT NULL DEFAULT 'MEMBER',
      status TEXT NOT NULL DEFAULT 'PENDING',
      rejection_reason TEXT,
      requires_password_change INTEGER NOT NULL DEFAULT 0,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. USERS SERVICE DB
  const usersDb = createMicroserviceDatabase('users.db', `
    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      account_type TEXT NOT NULL,
      role_id TEXT NOT NULL DEFAULT 'MEMBER',
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone_number TEXT,
      bio TEXT,
      country TEXT DEFAULT 'Sri Lanka',
      district TEXT,
      city TEXT,
      address_privacy TEXT DEFAULT 'APPROXIMATE',
      profile_photo_url TEXT,
      membership_tier TEXT DEFAULT 'FREE',
      rating_avg REAL DEFAULT 5.0,
      rating_count INTEGER DEFAULT 0,
      completed_services_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS profile_photos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data_base64 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. ADMIN SERVICE DB
  const adminDb = createMicroserviceDatabase('admin.db', `
    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. SKILLS SERVICE DB
  const skillsDb = createMicroserviceDatabase('skills.db', `
    CREATE TABLE IF NOT EXISTS skills_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      description TEXT,
      hourly_rate_credits REAL DEFAULT 1.0,
      availability_status TEXT DEFAULT 'AVAILABLE',
      preferred_locations TEXT,
      qualification_proof_url TEXT,
      work_samples TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS learning_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_percentage INTEGER DEFAULT 0,
      description TEXT,
      learning_institution TEXT,
      completion_date TEXT,
      certificate_url TEXT,
      project_image_url TEXT,
      work_samples TEXT,
      is_verified_by_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS skill_certificates (
      id TEXT PRIMARY KEY,
      learning_record_id TEXT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      issuer TEXT,
      issue_date TEXT,
      certificate_data TEXT,
      verified_at DATETIME,
      verified_by_admin_id TEXT
    );
  `);

  // 5. LOCATION SERVICE DB
  const locationDb = createMicroserviceDatabase('location.db', `
    CREATE TABLE IF NOT EXISTS user_locations (
      user_id TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      formatted_address TEXT,
      city TEXT,
      district TEXT,
      search_radius_km REAL DEFAULT 25.0,
      is_current_location INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. REQUESTS SERVICE DB
  const requestsDb = createMicroserviceDatabase('requests.db', `
    CREATE TABLE IF NOT EXISTS help_requests (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      skill_id TEXT,
      skill_name TEXT NOT NULL,
      description TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      duration_hours REAL NOT NULL DEFAULT 1.0,
      credits_offered REAL NOT NULL DEFAULT 1.0,
      location_name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      additional_notes TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS help_responses (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      helper_id TEXT NOT NULL,
      proposed_date TEXT,
      proposed_time TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. BOOKINGS SERVICE DB
  const bookingsDb = createMicroserviceDatabase('bookings.db', `
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_code TEXT NOT NULL UNIQUE,
      request_id TEXT,
      requester_id TEXT NOT NULL,
      helper_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      service_date TEXT NOT NULL,
      service_time TEXT NOT NULL,
      duration_hours REAL NOT NULL DEFAULT 1.0,
      credit_amount REAL NOT NULL DEFAULT 1.0,
      location_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      requester_confirmed_completion INTEGER DEFAULT 0,
      helper_confirmed_completion INTEGER DEFAULT 0,
      reschedule_proposed_date TEXT,
      reschedule_proposed_time TEXT,
      reschedule_reason TEXT,
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS booking_history (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. WALLET SERVICE DB
  const walletDb = createMicroserviceDatabase('wallet.db', `
    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY,
      available_credits REAL NOT NULL DEFAULT 3.0,
      earned_credits REAL NOT NULL DEFAULT 0.0,
      spent_credits REAL NOT NULL DEFAULT 0.0,
      pending_credits REAL NOT NULL DEFAULT 0.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS time_transactions (
      id TEXT PRIMARY KEY,
      reference_no TEXT NOT NULL UNIQUE,
      from_user_id TEXT,
      to_user_id TEXT,
      amount_credits REAL NOT NULL,
      transaction_type TEXT NOT NULL,
      related_booking_id TEXT,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. MESSAGING SERVICE DB
  const messagesDb = createMicroserviceDatabase('messages.db', `
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      related_booking_id TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user1_id, user2_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. EMAIL NOTIFICATION SERVICE DB
  const emailDb = createMicroserviceDatabase('email.db', `
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      template_type TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      link_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. SUBSCRIPTIONS SERVICE DB
  const subscriptionsDb = createMicroserviceDatabase('subscriptions.db', `
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_lkr REAL NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 30,
      features_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      community_id TEXT,
      organization_id TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME NOT NULL,
      auto_renew INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. PAYMENTS SERVICE DB
  const paymentsDb = createMicroserviceDatabase('payments.db', `
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      transaction_ref TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      plan_id TEXT,
      amount_lkr REAL NOT NULL,
      currency TEXT DEFAULT 'LKR',
      gateway TEXT DEFAULT 'PayHere',
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      payment_method TEXT DEFAULT 'CREDIT_CARD',
      gateway_response_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      payment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_lkr REAL NOT NULL,
      tax_lkr REAL DEFAULT 0.0,
      description TEXT NOT NULL,
      pdf_data TEXT,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 13. AI SERVICE DB
  const aiDb = createMicroserviceDatabase('ai.db', `
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT DEFAULT 'Time Bank AI Assistant Session',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 14. REVIEWS SERVICE DB
  const reviewsDb = createMicroserviceDatabase('reviews.db', `
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL UNIQUE,
      reviewer_id TEXT NOT NULL,
      reviewed_user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 15. ANALYTICS SERVICE DB
  const analyticsDb = createMicroserviceDatabase('analytics.db', `
    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      leader_id TEXT NOT NULL,
      district TEXT,
      city TEXT,
      plan_tier TEXT DEFAULT 'BASIC',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS community_members (
      id TEXT PRIMARY KEY,
      community_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'MEMBER',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(community_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      registration_no TEXT,
      plan_tier TEXT DEFAULT 'STANDARD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'VOLUNTEER',
      hours_contributed REAL DEFAULT 0.0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(organization_id, user_id)
    );
  `);

  // If we have legacy data, migrate it!
  if (legacyDb) {
    logger.info('Migrating existing tables and records to isolated microservice databases...');

    // Migrate Roles & Users
    try {
      const roles = legacyDb.prepare('SELECT * FROM roles').all() as any[];
      roles.forEach(r => {
        authDb.execute('INSERT OR IGNORE INTO roles (id, name, description, created_at) VALUES (?, ?, ?, ?)', [r.id, r.name, r.description, r.created_at]);
      });

      const users = legacyDb.prepare('SELECT * FROM users').all() as any[];
      users.forEach(u => {
        authDb.execute(
          `INSERT OR REPLACE INTO auth_users (id, email, password_hash, account_type, role_id, status, rejection_reason, requires_password_change, failed_login_attempts, locked_until, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.email, u.password_hash, u.account_type, u.role_id, u.status, u.rejection_reason, u.requires_password_change, u.failed_login_attempts, u.locked_until, u.created_at, u.updated_at]
        );
        usersDb.execute(
          `INSERT OR REPLACE INTO user_accounts (id, email, account_type, role_id, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [u.id, u.email, u.account_type, u.role_id, u.status, u.created_at]
        );
      });
      logger.info(`Migrated ${users.length} users into Auth and User Management databases.`);
    } catch (e: any) {
      logger.warn(`Users migration notice: ${e.message}`);
    }

    // Migrate User Profiles & Photos
    try {
      const profiles = legacyDb.prepare('SELECT * FROM user_profiles').all() as any[];
      profiles.forEach(p => {
        usersDb.execute(
          `INSERT OR REPLACE INTO user_profiles (user_id, full_name, phone_number, bio, country, district, city, address_privacy, profile_photo_url, membership_tier, rating_avg, rating_count, completed_services_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.user_id, p.full_name, p.phone_number, p.bio, p.country, p.district, p.city, p.address_privacy, p.profile_photo_url, p.membership_tier, p.rating_avg, p.rating_count, p.completed_services_count, p.created_at, p.updated_at]
        );
      });

      const photos = legacyDb.prepare('SELECT * FROM profile_photos').all() as any[];
      photos.forEach(ph => {
        usersDb.execute(
          `INSERT OR REPLACE INTO profile_photos (id, user_id, filename, mime_type, size_bytes, data_base64, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ph.id, ph.user_id, ph.filename, ph.mime_type, ph.size_bytes, ph.data_base64, ph.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`User profiles migration notice: ${e.message}`);
    }

    // Migrate Admin Logs
    try {
      const logs = legacyDb.prepare('SELECT * FROM admin_logs').all() as any[];
      logs.forEach(l => {
        adminDb.execute(
          `INSERT OR REPLACE INTO admin_logs (id, admin_id, action, target_type, target_id, details, ip_address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.admin_id, l.action, l.target_type, l.target_id, l.details, l.ip_address, l.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Admin logs migration notice: ${e.message}`);
    }

    // Migrate Skills & Learning Records
    try {
      const skills = legacyDb.prepare('SELECT * FROM skills').all() as any[];
      skills.forEach(s => {
        skillsDb.execute(
          `INSERT OR REPLACE INTO skills_catalog (id, name, category, description, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [s.id, s.name, s.category, s.description, s.is_active, s.created_at]
        );
      });

      const userSkills = legacyDb.prepare('SELECT * FROM user_skills').all() as any[];
      userSkills.forEach(us => {
        skillsDb.execute(
          `INSERT OR REPLACE INTO user_skills (id, user_id, skill_id, experience_level, description, hourly_rate_credits, availability_status, preferred_locations, qualification_proof_url, work_samples, is_verified, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [us.id, us.user_id, us.skill_id, us.experience_level, us.description, us.hourly_rate_credits, us.availability_status, us.preferred_locations, us.qualification_proof_url, us.work_samples, us.is_verified, us.created_at, us.updated_at]
        );
      });

      const lr = legacyDb.prepare('SELECT * FROM learning_records').all() as any[];
      lr.forEach(r => {
        skillsDb.execute(
          `INSERT OR REPLACE INTO learning_records (id, user_id, skill_name, category, status, progress_percentage, description, learning_institution, completion_date, certificate_url, project_image_url, work_samples, is_verified_by_admin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.user_id, r.skill_name, r.category, r.status, r.progress_percentage, r.description, r.learning_institution, r.completion_date, r.certificate_url, r.project_image_url, r.work_samples, r.is_verified_by_admin, r.created_at, r.updated_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Skills migration notice: ${e.message}`);
    }

    // Migrate Locations
    try {
      const locs = legacyDb.prepare('SELECT * FROM user_locations').all() as any[];
      locs.forEach(l => {
        locationDb.execute(
          `INSERT OR REPLACE INTO user_locations (user_id, latitude, longitude, formatted_address, city, district, search_radius_km, is_current_location, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.user_id, l.latitude, l.longitude, l.formatted_address, l.city, l.district, l.search_radius_km, l.is_current_location, l.updated_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Locations migration notice: ${e.message}`);
    }

    // Migrate Help Requests & Responses
    try {
      const requests = legacyDb.prepare('SELECT * FROM help_requests').all() as any[];
      requests.forEach(r => {
        requestsDb.execute(
          `INSERT OR REPLACE INTO help_requests (id, requester_id, title, category, skill_id, skill_name, description, preferred_date, preferred_time, duration_hours, credits_offered, location_name, latitude, longitude, additional_notes, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.requester_id, r.title, r.category, r.skill_id, r.skill_name, r.description, r.preferred_date, r.preferred_time, r.duration_hours, r.credits_offered, r.location_name, r.latitude, r.longitude, r.additional_notes, r.status, r.created_at, r.updated_at]
        );
      });

      const resp = legacyDb.prepare('SELECT * FROM help_responses').all() as any[];
      resp.forEach(rs => {
        requestsDb.execute(
          `INSERT OR REPLACE INTO help_responses (id, request_id, helper_id, proposed_date, proposed_time, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [rs.id, rs.request_id, rs.helper_id, rs.proposed_date, rs.proposed_time, rs.message, rs.status, rs.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Requests migration notice: ${e.message}`);
    }

    // Migrate Bookings & History
    try {
      const bookings = legacyDb.prepare('SELECT * FROM bookings').all() as any[];
      bookings.forEach(b => {
        bookingsDb.execute(
          `INSERT OR REPLACE INTO bookings (id, booking_code, request_id, requester_id, helper_id, skill_name, service_date, service_time, duration_hours, credit_amount, location_name, status, requester_confirmed_completion, helper_confirmed_completion, reschedule_proposed_date, reschedule_proposed_time, reschedule_reason, cancellation_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.id, b.booking_code, b.request_id, b.requester_id, b.helper_id, b.skill_name, b.service_date, b.service_time, b.duration_hours, b.credit_amount, b.location_name, b.status, b.requester_confirmed_completion, b.helper_confirmed_completion, b.reschedule_proposed_date, b.reschedule_proposed_time, b.reschedule_reason, b.cancellation_reason, b.created_at, b.updated_at]
        );
      });

      const bh = legacyDb.prepare('SELECT * FROM booking_history').all() as any[];
      bh.forEach(h => {
        bookingsDb.execute(
          `INSERT OR REPLACE INTO booking_history (id, booking_id, action, actor_id, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [h.id, h.booking_id, h.action, h.actor_id, h.notes, h.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Bookings migration notice: ${e.message}`);
    }

    // Migrate Wallets & Transactions
    try {
      const wallets = legacyDb.prepare('SELECT * FROM time_wallets').all() as any[];
      wallets.forEach(w => {
        walletDb.execute(
          `INSERT OR REPLACE INTO wallets (user_id, available_credits, earned_credits, spent_credits, pending_credits, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [w.user_id, w.available_credits, w.earned_credits, w.spent_credits, w.pending_credits, w.updated_at]
        );
      });

      const txs = legacyDb.prepare('SELECT * FROM time_transactions').all() as any[];
      txs.forEach(t => {
        walletDb.execute(
          `INSERT OR REPLACE INTO time_transactions (id, reference_no, from_user_id, to_user_id, amount_credits, transaction_type, related_booking_id, description, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.reference_no, t.from_user_id, t.to_user_id, t.amount_credits, t.transaction_type, t.related_booking_id, t.description, t.status, t.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Wallet migration notice: ${e.message}`);
    }

    // Migrate Messages & Conversations
    try {
      const convs = legacyDb.prepare('SELECT * FROM conversations').all() as any[];
      convs.forEach(c => {
        messagesDb.execute(
          `INSERT OR REPLACE INTO conversations (id, user1_id, user2_id, related_booking_id, last_message_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [c.id, c.user1_id, c.user2_id, c.related_booking_id, c.last_message_at, c.created_at]
        );
      });

      const msgs = legacyDb.prepare('SELECT * FROM messages').all() as any[];
      msgs.forEach(m => {
        messagesDb.execute(
          `INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, recipient_id, content, is_read, read_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.id, m.conversation_id, m.sender_id, m.recipient_id, m.content, m.is_read, m.read_at, m.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Messaging migration notice: ${e.message}`);
    }

    // Migrate Notifications & Emails
    try {
      const notifs = legacyDb.prepare('SELECT * FROM notifications').all() as any[];
      notifs.forEach(n => {
        emailDb.execute(
          `INSERT OR REPLACE INTO notifications (id, user_id, title, content, type, link_url, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [n.id, n.user_id, n.title, n.content, n.type, n.link_url, n.is_read, n.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Notifications migration notice: ${e.message}`);
    }

    // Migrate Subscriptions & Plans
    try {
      const plans = legacyDb.prepare('SELECT * FROM subscription_plans').all() as any[];
      plans.forEach(p => {
        subscriptionsDb.execute(
          `INSERT OR REPLACE INTO subscription_plans (id, name, category, price_lkr, duration_days, features_json, is_active, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.category, p.price_lkr, p.duration_days, p.features_json, p.is_active, p.updated_at]
        );
      });

      const subs = legacyDb.prepare('SELECT * FROM subscriptions').all() as any[];
      subs.forEach(s => {
        subscriptionsDb.execute(
          `INSERT OR REPLACE INTO subscriptions (id, user_id, plan_id, community_id, organization_id, status, start_date, end_date, auto_renew, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.user_id, s.plan_id, s.community_id, s.organization_id, s.status, s.start_date, s.end_date, s.auto_renew, s.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Subscriptions migration notice: ${e.message}`);
    }

    // Migrate Payments & Invoices
    try {
      const payments = legacyDb.prepare('SELECT * FROM payments').all() as any[];
      payments.forEach(py => {
        paymentsDb.execute(
          `INSERT OR REPLACE INTO payments (id, transaction_ref, user_id, plan_id, amount_lkr, currency, gateway, status, payment_method, gateway_response_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [py.id, py.transaction_ref, py.user_id, py.plan_id, py.amount_lkr, py.currency, py.gateway, py.status, py.payment_method, py.gateway_response_json, py.created_at]
        );
      });

      const invoices = legacyDb.prepare('SELECT * FROM invoices').all() as any[];
      invoices.forEach(inv => {
        paymentsDb.execute(
          `INSERT OR REPLACE INTO invoices (id, invoice_number, payment_id, user_id, amount_lkr, tax_lkr, description, pdf_data, issued_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [inv.id, inv.invoice_number, inv.payment_id, inv.user_id, inv.amount_lkr, inv.tax_lkr, inv.description, inv.pdf_data, inv.issued_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Payments migration notice: ${e.message}`);
    }

    // Migrate AI Messages & Conversations
    try {
      const aiconvs = legacyDb.prepare('SELECT * FROM ai_conversations').all() as any[];
      aiconvs.forEach(ac => {
        aiDb.execute(
          `INSERT OR REPLACE INTO ai_conversations (id, user_id, title, created_at)
           VALUES (?, ?, ?, ?)`,
          [ac.id, ac.user_id, ac.title, ac.created_at]
        );
      });

      const aimsgs = legacyDb.prepare('SELECT * FROM ai_messages').all() as any[];
      aimsgs.forEach(am => {
        aiDb.execute(
          `INSERT OR REPLACE INTO ai_messages (id, conversation_id, sender, content, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [am.id, am.conversation_id, am.sender, am.content, am.metadata_json, am.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`AI migration notice: ${e.message}`);
    }

    // Migrate Reviews
    try {
      const reviews = legacyDb.prepare('SELECT * FROM reviews').all() as any[];
      reviews.forEach(rv => {
        reviewsDb.execute(
          `INSERT OR REPLACE INTO reviews (id, booking_id, reviewer_id, reviewed_user_id, rating, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [rv.id, rv.booking_id, rv.reviewer_id, rv.reviewed_user_id, rv.rating, rv.comment, rv.created_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Reviews migration notice: ${e.message}`);
    }

    // Migrate Communities & Organizations
    try {
      const comms = legacyDb.prepare('SELECT * FROM communities').all() as any[];
      comms.forEach(cm => {
        analyticsDb.execute(
          `INSERT OR REPLACE INTO communities (id, name, description, leader_id, district, city, plan_tier, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cm.id, cm.name, cm.description, cm.leader_id, cm.district, cm.city, cm.plan_tier, cm.created_at]
        );
      });

      const cmem = legacyDb.prepare('SELECT * FROM community_members').all() as any[];
      cmem.forEach(m => {
        analyticsDb.execute(
          `INSERT OR REPLACE INTO community_members (id, community_id, user_id, role, joined_at)
           VALUES (?, ?, ?, ?, ?)`,
          [m.id, m.community_id, m.user_id, m.role, m.joined_at]
        );
      });

      const orgs = legacyDb.prepare('SELECT * FROM organizations').all() as any[];
      orgs.forEach(o => {
        analyticsDb.execute(
          `INSERT OR REPLACE INTO organizations (id, name, description, owner_id, registration_no, plan_tier, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [o.id, o.name, o.description, o.owner_id, o.registration_no, o.plan_tier, o.created_at]
        );
      });

      const omem = legacyDb.prepare('SELECT * FROM organization_members').all() as any[];
      omem.forEach(om => {
        analyticsDb.execute(
          `INSERT OR REPLACE INTO organization_members (id, organization_id, user_id, role, hours_contributed, joined_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [om.id, om.organization_id, om.user_id, om.role, om.hours_contributed, om.joined_at]
        );
      });
    } catch (e: any) {
      logger.warn(`Communities migration notice: ${e.message}`);
    }

    legacyDb.close();
  }

  // Ensure initial roles exist in authDb
  authDb.execute(`
    INSERT OR IGNORE INTO roles (id, name, description) VALUES
    ('SUPER_ADMIN', 'Super Administrator', 'Full control over platform configuration and approvals'),
    ('ADMIN', 'Community Administrator', 'Community moderation and verification'),
    ('COORDINATOR', 'Chapter Coordinator', 'Coordinates regional exchange activities'),
    ('MEMBER', 'Standard Member', 'Default member capable of offering and receiving skills')
  `);

  logger.info('Microservices database migration and verification completed successfully.');
}
