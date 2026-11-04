import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../../server/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface MicroserviceDatabase {
  db: Database.Database;
  queryOne<T = any>(sql: string, params?: any[]): T | undefined;
  queryAll<T = any>(sql: string, params?: any[]): T[];
  execute(sql: string, params?: any[]): Database.RunResult;
  transaction<T>(fn: () => T): T;
  close(): void;
}

export function createMicroserviceDatabase(fileName: string, initSql?: string): MicroserviceDatabase {
  const dbPath = path.join(dataDir, fileName);
  const db = new Database(dbPath);

  // Enable WAL mode and foreign keys for high concurrency & integrity
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  if (initSql) {
    db.exec(initSql);
  }

  return {
    db,
    queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
      const stmt = db.prepare(sql);
      return stmt.get(...params) as T | undefined;
    },
    queryAll<T = any>(sql: string, params: any[] = []): T[] {
      const stmt = db.prepare(sql);
      return stmt.all(...params) as T[];
    },
    execute(sql: string, params: any[] = []): Database.RunResult {
      const stmt = db.prepare(sql);
      return stmt.run(...params);
    },
    transaction<T>(fn: () => T): T {
      const runTx = db.transaction(fn);
      return runTx();
    },
    close() {
      db.close();
    }
  };
}
