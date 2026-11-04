import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const locationDb = createMicroserviceDatabase('location.db', `
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
