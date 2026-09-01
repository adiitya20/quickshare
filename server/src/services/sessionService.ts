import { db } from '../db/index.js';
import { generateSecureToken, hashToken, generateId } from '../utils/crypto.js';
import { config } from '../utils/config.js';
import { SessionRecord, FileRecord, SessionStatus } from '../types/index.js';

export function createSession(pcIdInput?: string): {
  session: SessionRecord;
  rawToken: string;
} {
  const pcId = pcIdInput || `LAB-01 / PC-${Math.floor(Math.random() * 90 + 10)}`;
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const sessionId = generateId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.sessionDurationMinutes * 60 * 1000);

  const stmt = db.prepare(`
    INSERT INTO sessions (id, pc_id, token_hash, created_at, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    sessionId,
    pcId,
    tokenHash,
    now.toISOString(),
    expiresAt.toISOString(),
    'WAITING'
  );

  const session: SessionRecord = {
    id: sessionId,
    pc_id: pcId,
    token_hash: tokenHash,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'WAITING'
  };

  return { session, rawToken };
}

export function getSessionByToken(token: string): SessionRecord | null {
  const tokenHash = hashToken(token);
  const stmt = db.prepare('SELECT * FROM sessions WHERE token_hash = ?');
  const session = stmt.get(tokenHash) as SessionRecord | undefined;
  return session || null;
}

export function getSessionById(sessionId: string): SessionRecord | null {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const session = stmt.get(sessionId) as SessionRecord | undefined;
  return session || null;
}

export function updateSessionStatus(sessionId: string, status: SessionStatus): void {
  const stmt = db.prepare('UPDATE sessions SET status = ? WHERE id = ?');
  stmt.run(status, sessionId);
}

export function getSessionFiles(sessionId: string): FileRecord[] {
  const stmt = db.prepare('SELECT * FROM files WHERE session_id = ? ORDER BY created_at DESC');
  return stmt.all(sessionId) as FileRecord[];
}

export function getExpiredSessions(): SessionRecord[] {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE expires_at <= ? AND status NOT IN ('EXPIRED', 'CLOSED')
  `);
  return stmt.all(now) as SessionRecord[];
}

export function markSessionExpired(sessionId: string): void {
  const stmt = db.prepare(`UPDATE sessions SET status = 'EXPIRED' WHERE id = ?`);
  stmt.run(sessionId);
}

export function deleteSessionRecord(sessionId: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  stmt.run(sessionId);
}
