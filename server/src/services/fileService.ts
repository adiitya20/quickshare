import fs from 'fs';
import path from 'path';
import { 
  dbInsertFile, 
  dbGetFileById, 
  dbDeleteFile, 
  dbDeleteFilesBySessionId 
} from '../db';
import { generateId } from '../utils/crypto';
import { sanitizeFilename } from '../utils/sanitizer';
import { config } from '../utils/config';
import { FileRecord } from '../types';

export function createFileRecord(
  sessionId: string,
  originalFilename: string,
  storedFilename: string,
  mimeType: string,
  size: number
): FileRecord {
  const fileId = generateId();
  const safeOriginalName = sanitizeFilename(originalFilename);
  const now = new Date().toISOString();

  const fileRecord: FileRecord = {
    id: fileId,
    session_id: sessionId,
    original_filename: safeOriginalName,
    stored_filename: storedFilename,
    mime_type: mimeType,
    size,
    created_at: now
  };

  dbInsertFile(fileRecord);

  return fileRecord;
}

export function getFileById(fileId: string): FileRecord | null {
  return dbGetFileById(fileId);
}

export function deleteFile(fileId: string): boolean {
  const record = getFileById(fileId);
  if (!record) return false;

  const filePath = path.join(config.uploadDir, record.session_id, record.stored_filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Error deleting physical file ${filePath}:`, err);
    }
  }

  dbDeleteFile(fileId);
  return true;
}

export function deleteAllSessionFiles(sessionId: string): void {
  const sessionDir = path.join(config.uploadDir, sessionId);
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error removing session directory ${sessionDir}:`, err);
    }
  }

  dbDeleteFilesBySessionId(sessionId);
}
