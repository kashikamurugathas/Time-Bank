import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const paymentsDb = createMicroserviceDatabase('payments.db', `
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
