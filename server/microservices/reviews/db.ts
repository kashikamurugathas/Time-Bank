import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const reviewsDb = createMicroserviceDatabase('reviews.db', `
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
