import { 
  dbInsertSession, 
  dbGetSessionByTokenHash, 
  dbGetSessionById, 
  dbUpdateSessionStatus, 
  dbGetFilesBySessionId, 
  dbGetExpiredSessions, 
  dbMarkSessionExpired, 
  dbDeleteSession 
} from '../db';
import { generateSignedToken, decodeSignedToken, hashToken, generateId } from '../utils/crypto';
import { config } from '../utils/config';
import { SessionRecord, FileRecord, SessionStatus } from '../types';

export function createSession(pcIdInput?: string): {
  session: SessionRecord;
  rawToken: string;
} {
  const sessionId = generateId();
  const pcId = pcIdInput || `PC-${Math.floor(1000 + Math.random() * 9000)}`;
  const rawToken = generateSignedToken(sessionId, pcId, config.sessionDurationMinutes);
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.sessionDurationMinutes * 60 * 1000);

  const session: SessionRecord = {
    id: sessionId,
    pc_id: pcId,
    token_hash: tokenHash,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'WAITING'
  };

  dbInsertSession(session);

  return { session, rawToken };
}

export function getSessionByToken(token: string): SessionRecord | null {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const existing = dbGetSessionByTokenHash(tokenHash);
  if (existing) {
    // Check if countdown expired
    if (new Date(existing.expires_at).getTime() <= Date.now() && existing.status !== 'EXPIRED' && existing.status !== 'CLOSED') {
      existing.status = 'EXPIRED';
      dbUpdateSessionStatus(existing.id, 'EXPIRED');
    }
    return existing;
  }

  // If not found in local DB store (e.g. separate Vercel serverless instance), decode signed capability token
  const decoded = decodeSignedToken(token);
  if (decoded) {
    const { payload, isExpired } = decoded;
    const session: SessionRecord = {
      id: payload.s,
      pc_id: payload.p,
      token_hash: tokenHash,
      created_at: new Date(payload.e - config.sessionDurationMinutes * 60 * 1000).toISOString(),
      expires_at: new Date(payload.e).toISOString(),
      status: isExpired ? 'EXPIRED' : 'WAITING'
    };
    dbInsertSession(session);
    return session;
  }

  return null;
}

export function getSessionById(sessionId: string): SessionRecord | null {
  return dbGetSessionById(sessionId);
}

export function updateSessionStatus(sessionId: string, status: SessionStatus): void {
  dbUpdateSessionStatus(sessionId, status);
}

export function getSessionFiles(sessionId: string): FileRecord[] {
  return dbGetFilesBySessionId(sessionId);
}

export function getExpiredSessions(): SessionRecord[] {
  return dbGetExpiredSessions(new Date().toISOString());
}

export function markSessionExpired(sessionId: string): void {
  dbMarkSessionExpired(sessionId);
}

export function deleteSessionRecord(sessionId: string): void {
  dbDeleteSession(sessionId);
}
