import { createMicroserviceDatabase } from '../common/db-factory.ts';

export const skillsDb = createMicroserviceDatabase('skills.db', `
  CREATE TABLE IF NOT EXISTS skills_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_skills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    description TEXT,
    hourly_rate_credits REAL DEFAULT 1.0,
    availability_status TEXT DEFAULT 'AVAILABLE',
    preferred_locations TEXT,
    qualification_proof_url TEXT,
    work_samples TEXT,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS learning_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    description TEXT,
    learning_institution TEXT,
    completion_date TEXT,
    certificate_url TEXT,
    project_image_url TEXT,
    work_samples TEXT,
    is_verified_by_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS skill_certificates (
    id TEXT PRIMARY KEY,
    learning_record_id TEXT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    issuer TEXT,
    issue_date TEXT,
    certificate_data TEXT,
    verified_at DATETIME,
    verified_by_admin_id TEXT
  );
`);
