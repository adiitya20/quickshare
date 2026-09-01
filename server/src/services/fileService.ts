import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { generateId } from '../utils/crypto.js';
import { sanitizeFilename } from '../utils/sanitizer.js';
import { config } from '../utils/config.js';
import { FileRecord } from '../types/index.js';

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

  const stmt = db.prepare(`
    INSERT INTO files (id, session_id, original_filename, stored_filename, mime_type, size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    fileId,
    sessionId,
    safeOriginalName,
    storedFilename,
    mimeType,
    size,
    now
  );

  return {
    id: fileId,
    session_id: sessionId,
    original_filename: safeOriginalName,
    stored_filename: storedFilename,
    mime_type: mimeType,
    size,
    created_at: now
  };
}

export function getFileById(fileId: string): FileRecord | null {
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  const record = stmt.get(fileId) as FileRecord | undefined;
  return record || null;
}

export function deleteFile(fileId: string): boolean {
  const record = getFileById(fileId);
  if (!record) return false;

  // Remove physical file
  const filePath = path.join(config.uploadDir, record.session_id, record.stored_filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Error deleting physical file ${filePath}:`, err);
    }
  }

  // Delete DB record
  const stmt = db.prepare('DELETE FROM files WHERE id = ?');
  stmt.run(fileId);
  return true;
}

export function deleteAllSessionFiles(sessionId: string): void {
  // Delete all physical files in session folder
  const sessionDir = path.join(config.uploadDir, sessionId);
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error removing session directory ${sessionDir}:`, err);
    }
  }

  // Delete DB file records
  const stmt = db.prepare('DELETE FROM files WHERE session_id = ?');
  stmt.run(sessionId);
}
