-- Time Bank Community Platform - SQLite Database Schema
PRAGMA foreign_keys = ON;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('INDIVIDUAL', 'COMMUNITY', 'ORGANIZATION')),
  role_id TEXT NOT NULL DEFAULT 'MEMBER',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
  rejection_reason TEXT,
  requires_password_change INTEGER NOT NULL DEFAULT 0,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  bio TEXT,
  country TEXT DEFAULT 'Sri Lanka',
  district TEXT,
  city TEXT,
  address_privacy TEXT DEFAULT 'APPROXIMATE' CHECK(address_privacy IN ('APPROXIMATE', 'CITY_ONLY', 'PUBLIC')),
  profile_photo_url TEXT,
  membership_tier TEXT DEFAULT 'FREE' CHECK(membership_tier IN ('FREE', 'PREMIUM')),
  rating_avg REAL DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  completed_services_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Profile Photos (stores photo metadata & secure storage reference)
CREATE TABLE IF NOT EXISTS profile_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  data_base64 TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Locations (stores geocoordinates for proximity calculation)
CREATE TABLE IF NOT EXISTS user_locations (
  user_id TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  formatted_address TEXT,
  city TEXT,
  district TEXT,
  search_radius_km REAL DEFAULT 25.0,
  is_current_location INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Skills Catalog
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Skills (skills registered by members)
CREATE TABLE IF NOT EXISTS user_skills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK(experience_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT')),
  description TEXT,
  hourly_rate_credits REAL DEFAULT 1.0,
  availability_status TEXT DEFAULT 'AVAILABLE' CHECK(availability_status IN ('AVAILABLE', 'BUSY', 'UNAVAILABLE')),
  preferred_locations TEXT,
  qualification_proof_url TEXT,
  work_samples TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Learning Records (My Learning Journey)
CREATE TABLE IF NOT EXISTS learning_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('CURRENTLY_LEARNING', 'NEWLY_ACQUIRED', 'VERIFIED')),
  progress_percentage INTEGER DEFAULT 0,
  description TEXT,
  learning_institution TEXT,
  completion_date TEXT,
  certificate_url TEXT,
  project_image_url TEXT,
  work_samples TEXT,
  is_verified_by_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Skill Certificates
CREATE TABLE IF NOT EXISTS skill_certificates (
  id TEXT PRIMARY KEY,
  learning_record_id TEXT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT,
  issue_date TEXT,
  certificate_data TEXT,
  verified_at DATETIME,
  verified_by_admin_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (learning_record_id) REFERENCES learning_records(id) ON DELETE SET NULL
);

-- Time Wallets
CREATE TABLE IF NOT EXISTS time_wallets (
  user_id TEXT PRIMARY KEY,
  available_credits REAL NOT NULL DEFAULT 3.0, -- Welcome gift of 3 credits
  earned_credits REAL NOT NULL DEFAULT 0.0,
  spent_credits REAL NOT NULL DEFAULT 0.0,
  pending_credits REAL NOT NULL DEFAULT 0.0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Time Transactions Ledger
CREATE TABLE IF NOT EXISTS time_transactions (
  id TEXT PRIMARY KEY,
  reference_no TEXT NOT NULL UNIQUE,
  from_user_id TEXT,
  to_user_id TEXT,
  amount_credits REAL NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('TRANSFER', 'EARNED', 'SPENT', 'HOLD', 'REFUND', 'BONUS', 'ADMIN_ADJUSTMENT')),
  related_booking_id TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Help Requests
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
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'PENDING_RESPONSE', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);

-- Help Responses / Offers from helpers
CREATE TABLE IF NOT EXISTS help_responses (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  helper_id TEXT NOT NULL,
  proposed_date TEXT,
  proposed_time TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES help_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bookings
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
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN ('PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  requester_confirmed_completion INTEGER DEFAULT 0,
  helper_confirmed_completion INTEGER DEFAULT 0,
  reschedule_proposed_date TEXT,
  reschedule_proposed_time TEXT,
  reschedule_reason TEXT,
  cancellation_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES help_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (helper_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Booking History
CREATE TABLE IF NOT EXISTS booking_history (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Reviews and Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  reviewer_id TEXT NOT NULL,
  reviewed_user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  related_booking_id TEXT,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id),
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('REGISTRATION', 'APPROVAL', 'HELP_REQUEST', 'MESSAGE', 'BOOKING', 'CREDIT', 'SUBSCRIPTION', 'SYSTEM')),
  link_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email Logs
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('SENT', 'FAILED', 'SIMULATED')),
  error_message TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id TEXT NOT NULL,
  district TEXT,
  city TEXT,
  plan_tier TEXT DEFAULT 'BASIC' CHECK(plan_tier IN ('BASIC', 'PLUS')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'MEMBER' CHECK(role IN ('LEADER', 'COORDINATOR', 'MEMBER')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(community_id, user_id),
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  registration_no TEXT,
  plan_tier TEXT DEFAULT 'STANDARD' CHECK(plan_tier IN ('STANDARD', 'PREMIUM')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'VOLUNTEER' CHECK(role IN ('ADMIN', 'COORDINATOR', 'VOLUNTEER')),
  hours_contributed REAL DEFAULT 0.0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('COMMUNITY', 'ORGANIZATION', 'PREMIUM_INDIVIDUAL')),
  price_lkr REAL NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  features_json TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  community_id TEXT,
  organization_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_PAYMENT')),
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NOT NULL,
  auto_renew INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  transaction_ref TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  plan_id TEXT,
  amount_lkr REAL NOT NULL,
  currency TEXT DEFAULT 'LKR',
  gateway TEXT DEFAULT 'PayHere',
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK(status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  payment_method TEXT DEFAULT 'CREDIT_CARD',
  gateway_response_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  payment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  amount_lkr REAL NOT NULL,
  tax_lkr REAL DEFAULT 0.0,
  description TEXT NOT NULL,
  pdf_data TEXT,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  raised_by_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED')),
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (raised_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT DEFAULT 'Time Bank AI Assistant Session',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

-- Admin Logs / Audit Trail
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indices for high performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_users ON bookings(requester_id, helper_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_time_transactions_users ON time_transactions(from_user_id, to_user_id);
