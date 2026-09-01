import { app } from '../server/src/app.js';
import { initDatabase } from '../server/src/db/index.js';

// Initialize Database schema for serverless execution
try {
  initDatabase();
} catch (e) {
  console.error('Database init error:', e);
}

export default app;
