import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const requestsDb = createMicroserviceDatabase('requests.db', `
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
