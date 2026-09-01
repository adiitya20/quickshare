import http from 'http';
import { app } from './app';
import { config } from './utils/config';
import { initDatabase } from './db';
import { initSocketServer } from './services/socketService';
import { startCleanupTask, stopCleanupTask } from './services/cleanupService';

initDatabase();

const server = http.createServer(app);
initSocketServer(server);
startCleanupTask();

server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 QRPrint Server running on http://localhost:${config.port}`);
  console.log(`🔒 Session Duration: ${config.sessionDurationMinutes} minutes`);
  console.log(`🧹 Auto-Cleanup Interval: ${config.cleanupIntervalSeconds} seconds`);
  console.log(`=======================================================`);
});

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
