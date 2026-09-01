import http from 'http';
import { app } from './app.js';
import { config } from './utils/config.js';
import { initDatabase } from './db/index.js';
import { initSocketServer } from './services/socketService.js';
import { startCleanupTask, stopCleanupTask } from './services/cleanupService.js';

// 1. Initialize Database & Schema
initDatabase();

// 2. Create HTTP server & attach Socket.IO
const server = http.createServer(app);
initSocketServer(server);

// 3. Start periodic cleanup task for expired sessions
startCleanupTask();

// 4. Start HTTP Server listening
server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 QRPrint Server running on http://localhost:${config.port}`);
  console.log(`🔒 Session Duration: ${config.sessionDurationMinutes} minutes`);
  console.log(`🧹 Auto-Cleanup Interval: ${config.cleanupIntervalSeconds} seconds`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  stopCleanupTask();
  server.close(() => {
    console.log('HTTP Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
