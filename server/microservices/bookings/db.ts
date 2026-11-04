import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const bookingsDb = createMicroserviceDatabase('bookings.db', `
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
