import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const walletDb = createMicroserviceDatabase('wallet.db', `
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
