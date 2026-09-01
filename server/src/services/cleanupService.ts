import { getExpiredSessions, markSessionExpired } from './sessionService.js';
import { deleteAllSessionFiles } from './fileService.js';
import { notifySessionExpired } from './socketService.js';
import { config } from '../utils/config.js';

let intervalTimer: NodeJS.Timeout | null = null;

export function purgeExpiredSessionsNow(): number {
  const expiredSessions = getExpiredSessions();
  let count = 0;

  for (const session of expiredSessions) {
    try {
      // 1. Delete physical files from disk & file DB records
      deleteAllSessionFiles(session.id);
      // 2. Mark session as EXPIRED in DB
      markSessionExpired(session.id);
      // 3. Notify connected WebSockets
      notifySessionExpired(session.id, 'Session countdown timer expired. Files deleted.');
      count++;
    } catch (err) {
      console.error(`Error purging expired session ${session.id}:`, err);
    }
  }

  return count;
}

export function startCleanupTask(): void {
  if (intervalTimer) return;

  // Run immediately on startup
  purgeExpiredSessionsNow();

  // Schedule periodic cleanup
  intervalTimer = setInterval(() => {
    purgeExpiredSessionsNow();
  }, config.cleanupIntervalSeconds * 1000);
}

export function stopCleanupTask(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}
