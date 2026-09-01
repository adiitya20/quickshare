import { getExpiredSessions, markSessionExpired } from './sessionService';
import { deleteAllSessionFiles } from './fileService';
import { notifySessionExpired } from './socketService';
import { config } from '../utils/config';

let intervalTimer: NodeJS.Timeout | null = null;

export function purgeExpiredSessionsNow(): number {
  const expiredSessions = getExpiredSessions();
  let count = 0;

  for (const session of expiredSessions) {
    try {
      deleteAllSessionFiles(session.id);
      markSessionExpired(session.id);
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

  purgeExpiredSessionsNow();

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
