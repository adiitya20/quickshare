import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

const defaultDbPath = isVercel ? '/tmp/qrprint.db' : './qrprint.db';
const defaultUploadDir = isVercel ? '/tmp/uploads' : './uploads';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  dbPath: path.resolve(process.cwd(), process.env.DATABASE_PATH || defaultDbPath),
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || defaultUploadDir),
  sessionDurationMinutes: parseInt(process.env.SESSION_DURATION_MINUTES || '10', 10),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
  maxSessionFiles: parseInt(process.env.MAX_SESSION_FILES || '20', 10),
  maxSessionTotalSizeMB: parseInt(process.env.MAX_SESSION_TOTAL_SIZE_MB || '100', 10),
  cleanupIntervalSeconds: parseInt(process.env.CLEANUP_INTERVAL_SECONDS || '30', 10),
};
