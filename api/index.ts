import { app } from '../server/src/app';
import { initDatabase } from '../server/src/db';

try {
  initDatabase();
} catch (e) {
  console.error('Database init error:', e);
}

export default app;
