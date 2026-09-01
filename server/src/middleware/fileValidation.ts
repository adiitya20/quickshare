import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../utils/config';
import { isAllowedExtension } from '../utils/sanitizer';
import { getSessionByToken, getSessionFiles } from '../services/sessionService';

function extractStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// Use Memory Storage for 100% Vercel serverless read-only filesystem compatibility
const storage = multer.memoryStorage();

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
    const token = extractStringParam(req.params.token);
    if (!token) {
      return res.status(400).json({ error: 'Session token is required.' });
    }

    const session = getSessionByToken(token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or token invalid.' });
    }

    const isExpired = new Date(session.expires_at).getTime() <= Date.now() || session.status === 'EXPIRED' || session.status === 'CLOSED';

    if (isExpired) {
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
