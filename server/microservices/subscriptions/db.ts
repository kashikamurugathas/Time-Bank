import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const subscriptionsDb = createMicroserviceDatabase('subscriptions.db', `
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
