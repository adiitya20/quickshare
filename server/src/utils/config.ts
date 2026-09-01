import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  dbPath: path.resolve(process.cwd(), process.env.DATABASE_PATH || './qrprint.db'),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  sessionDurationMinutes: parseInt(process.env.SESSION_DURATION_MINUTES || '10', 10),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
  maxSessionFiles: parseInt(process.env.MAX_SESSION_FILES || '20', 10),
  maxSessionTotalSizeMB: parseInt(process.env.MAX_SESSION_TOTAL_SIZE_MB || '100', 10),
  cleanupIntervalSeconds: parseInt(process.env.CLEANUP_INTERVAL_SECONDS || '30', 10),
};
