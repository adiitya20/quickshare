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

const memoryFileBuffers = new Map<string, Buffer>();

export function createFileRecord(
  sessionId: string,
  originalFilename: string,
  storedFilename: string,
  mimeType: string,
  size: number,
  buffer?: Buffer
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

  if (buffer) {
    memoryFileBuffers.set(fileId, buffer);

    // Also attempt saving to disk if filesystem is writable
    try {
      const sessionDir = path.join(config.uploadDir, sessionId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      fs.writeFileSync(path.join(sessionDir, storedFilename), buffer);
    } catch (e) {
      // Ignored if serverless read-only
    }
  }

  return fileRecord;
}

export function getFileById(fileId: string): FileRecord | null {
  return dbGetFileById(fileId);
}

export function getFileBuffer(fileId: string): Buffer | null {
  const buf = memoryFileBuffers.get(fileId);
  if (buf) return buf;

  const record = getFileById(fileId);
  if (record) {
    const filePath = path.join(config.uploadDir, record.session_id, record.stored_filename);
    if (fs.existsSync(filePath)) {
      try {
        return fs.readFileSync(filePath);
      } catch (e) {}
    }
  }

  return null;
}

export function deleteFile(fileId: string): boolean {
  const record = getFileById(fileId);
  if (!record) return false;

  memoryFileBuffers.delete(fileId);

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
