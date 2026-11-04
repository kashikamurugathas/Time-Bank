import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const usersDb = createMicroserviceDatabase('users.db', `
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
