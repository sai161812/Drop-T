import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { runMigrations } from './migrations.js';

let dbInstance: DatabaseSync | null = null;

export function initDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const targetPath = dbPath || path.join(config.dataDir, 'droptest.sqlite');
  
  // Ensure data directory exists
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  if (targetPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
  }
  runMigrations(db);
  dbInstance = db;
  return db;
}

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
