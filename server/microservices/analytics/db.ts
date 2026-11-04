import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const analyticsDb = createMicroserviceDatabase('analytics.db', `
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
