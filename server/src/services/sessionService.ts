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
import { generateSecureToken, hashToken, generateId } from '../utils/crypto';
import { config } from '../utils/config';
import { SessionRecord, FileRecord, SessionStatus } from '../types';

export function createSession(pcIdInput?: string): {
  session: SessionRecord;
  rawToken: string;
} {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const sessionId = generateId();
  const pcId = pcIdInput || `PC-${Math.floor(1000 + Math.random() * 9000)}`;
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
  const tokenHash = hashToken(token);
  return dbGetSessionByTokenHash(tokenHash);
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
