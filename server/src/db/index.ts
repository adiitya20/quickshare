import fs from 'fs';
import path from 'path';
import { config } from '../utils/config';
import { SessionRecord, FileRecord, SessionStatus } from '../types';

let sqliteDb: any = null;

try {
  const { DatabaseSync } = require('node:sqlite');
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new DatabaseSync(config.dbPath);
  try {
    sqliteDb.exec('PRAGMA journal_mode = WAL');
  } catch (e) {}
} catch (err) {
  console.warn('node:sqlite not available or failed to initialize. Using high-performance in-memory JS store fallback.');
  sqliteDb = null;
}

const memorySessions = new Map<string, SessionRecord>();
const memoryFiles = new Map<string, FileRecord>();

export function initDatabase() {
  if (sqliteDb) {
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          pc_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          created_at DATETIME NOT NULL,
          expires_at DATETIME NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('WAITING', 'CONNECTED', 'UPLOADING', 'READY', 'EXPIRED', 'CLOSED'))
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          stored_filename TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          created_at DATETIME NOT NULL,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_files_session_id ON files(session_id);
      `);
    } catch (e) {
      sqliteDb = null;
    }
  }

  if (!fs.existsSync(config.uploadDir)) {
    try {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    } catch (e) {}
  }
}

export function dbInsertSession(session: SessionRecord): void {
  memorySessions.set(session.id, { ...session });
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO sessions (id, pc_id, token_hash, created_at, expires_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(session.id, session.pc_id, session.token_hash, session.created_at, session.expires_at, session.status);
    } catch (e) {}
  }
}

export function dbGetSessionByTokenHash(tokenHash: string): SessionRecord | null {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM sessions WHERE token_hash = ?');
      const res = stmt.get(tokenHash) as SessionRecord | undefined;
      if (res) return res;
    } catch (e) {}
  }
  for (const s of memorySessions.values()) {
    if (s.token_hash === tokenHash) return s;
  }
  return null;
}

export function dbGetSessionById(id: string): SessionRecord | null {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM sessions WHERE id = ?');
      const res = stmt.get(id) as SessionRecord | undefined;
      if (res) return res;
    } catch (e) {}
  }
  return memorySessions.get(id) || null;
}

export function dbUpdateSessionStatus(id: string, status: SessionStatus): void {
  const session = memorySessions.get(id);
  if (session) {
    session.status = status;
  }
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('UPDATE sessions SET status = ? WHERE id = ?');
      stmt.run(status, id);
    } catch (e) {}
  }
}

export function dbSetSessionExpiresAt(id: string, expiresAt: string): void {
  const session = memorySessions.get(id);
  if (session) {
    session.expires_at = expiresAt;
  }
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?');
      stmt.run(expiresAt, id);
    } catch (e) {}
  }
}

export function dbGetExpiredSessions(nowIso: string): SessionRecord[] {
  const expired: SessionRecord[] = [];
  const nowTime = new Date(nowIso).getTime();

  for (const s of memorySessions.values()) {
    if (new Date(s.expires_at).getTime() <= nowTime && s.status !== 'EXPIRED' && s.status !== 'CLOSED') {
      expired.push(s);
    }
  }

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        SELECT * FROM sessions 
        WHERE expires_at <= ? AND status NOT IN ('EXPIRED', 'CLOSED')
      `);
      const res = stmt.all(nowIso) as SessionRecord[];
      if (res && res.length > 0) return res;
    } catch (e) {}
  }

  return expired;
}

export function dbMarkSessionExpired(id: string): void {
  dbUpdateSessionStatus(id, 'EXPIRED');
}

export function dbDeleteSession(id: string): void {
  memorySessions.delete(id);
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM sessions WHERE id = ?');
      stmt.run(id);
    } catch (e) {}
  }
}

export function dbInsertFile(file: FileRecord): void {
  memoryFiles.set(file.id, { ...file });
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO files (id, session_id, original_filename, stored_filename, mime_type, size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(file.id, file.session_id, file.original_filename, file.stored_filename, file.mime_type, file.size, file.created_at);
    } catch (e) {}
  }
}

export function dbGetFileById(id: string): FileRecord | null {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM files WHERE id = ?');
      const res = stmt.get(id) as FileRecord | undefined;
      if (res) return res;
    } catch (e) {}
  }
  return memoryFiles.get(id) || null;
}

export function dbGetFilesBySessionId(sessionId: string): FileRecord[] {
  const result: FileRecord[] = [];
  for (const f of memoryFiles.values()) {
    if (f.session_id === sessionId) {
      result.push(f);
    }
  }

  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM files WHERE session_id = ? ORDER BY created_at DESC');
      const res = stmt.all(sessionId) as FileRecord[];
      if (res && res.length > 0) return res;
    } catch (e) {}
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function dbDeleteFile(id: string): void {
  memoryFiles.delete(id);
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM files WHERE id = ?');
      stmt.run(id);
    } catch (e) {}
  }
}

export function dbDeleteFilesBySessionId(sessionId: string): void {
  for (const [id, f] of memoryFiles.entries()) {
    if (f.session_id === sessionId) {
      memoryFiles.delete(id);
    }
  }
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM files WHERE session_id = ?');
      stmt.run(sessionId);
    } catch (e) {}
  }
}
