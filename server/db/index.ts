import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'timebank.db');
export const db = new Database(dbPath);

// Performance and safety pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// Run schema initialization
const schemaPath = path.resolve(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function execute(sql: string, params: any[] = []): Database.RunResult {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(fn: () => T): T {
  const runTx = db.transaction(fn);
  return runTx();
}

export default db;
