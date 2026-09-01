import crypto from 'crypto';
import { config } from './config';

const SECRET_KEY = process.env.SESSION_SECRET || 'qrshareit-secure-capability-token-secret-9842';

export interface TokenPayload {
  s: string; // sessionId
  p: string; // pcId
  pin: string; // 4-digit PIN
  e: number; // expiresAt timestamp (ms)
}

/**
 * Generate a 4-digit numeric PIN for WhatsApp session connection
 */
export function generateNumericPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a signed session capability token containing session ID, PC ID, PIN, and expiry timestamp
 */
export function generateSignedToken(sessionId: string, pcId: string, pin: string, durationMinutes: number = 10): string {
  const expiresAt = Date.now() + durationMinutes * 60 * 1000;
  const payload: TokenPayload = { s: sessionId, p: pcId, pin, e: expiresAt };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode a signed session capability token
 */
export function decodeSignedToken(token: string): { payload: TokenPayload; isExpired: boolean } | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payloadBase64).digest('hex');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null; // Tampered token
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload: TokenPayload = JSON.parse(payloadJson);
    const isExpired = Date.now() > payload.e;
    return { payload, isExpired };
  } catch (e) {
    return null;
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}
