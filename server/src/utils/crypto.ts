import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token (64 hex chars = 256 bits of entropy)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash token using SHA-256 for DB lookup
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a safe unique ID for sessions and files
 */
export function generateId(): string {
  return crypto.randomUUID();
}
