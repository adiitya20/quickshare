import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../utils/config';
import { isAllowedExtension, sanitizeFilename } from '../utils/sanitizer';
import { generateId } from '../utils/crypto';
import { getSessionByToken, getSessionFiles } from '../services/sessionService';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const session = (req as any).sessionRecord;
    if (!session) {
      return cb(new Error('Session not found'), '');
    }
    const sessionDir = path.join(config.uploadDir, session.id);
    if (!fs.existsSync(sessionDir)) {
      try {
        fs.mkdirSync(sessionDir, { recursive: true });
      } catch (e) {}
    }
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${generateId()}${ext}`;
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const originalName = file.originalname;
  if (!isAllowedExtension(originalName)) {
    return cb(new Error(`File type '${path.extname(originalName)}' is not allowed.`));
  }
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024,
  }
});

export async function validateUploadSession(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ error: 'Session token is required.' });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or token invalid.' });
    }

    if (session.status === 'EXPIRED' || session.status === 'CLOSED' || new Date(session.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This QR session has expired. Please scan the new QR code on the PC.' });
    }

    const existingFiles = getSessionFiles(session.id);
    if (existingFiles.length >= config.maxSessionFiles) {
      return res.status(400).json({ error: `Session maximum of ${config.maxSessionFiles} files reached.` });
    }

    const currentTotalSize = existingFiles.reduce((acc, f) => acc + f.size, 0);
    const maxTotalSizeBytes = config.maxSessionTotalSizeMB * 1024 * 1024;
    if (currentTotalSize >= maxTotalSizeBytes) {
      return res.status(400).json({ error: `Session total storage limit of ${config.maxSessionTotalSizeMB}MB reached.` });
    }

    (req as any).sessionRecord = session;
    (req as any).existingFiles = existingFiles;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error validating session for upload.' });
  }
}
