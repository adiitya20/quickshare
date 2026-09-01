import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  createFileRecord, 
  getFileById, 
  getFileBuffer,
  deleteFile, 
  deleteAllSessionFiles 
} from '../services/fileService';
import { 
  getSessionByToken, 
  getSessionFiles, 
  updateSessionStatus 
} from '../services/sessionService';
import { notifyFilesReceived, notifyFileDeleted } from '../services/socketService';
import { config } from '../utils/config';
import { generateId } from '../utils/crypto';
import { FileItem } from '../types';

function extractStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// In-Memory store for accumulating file chunks
const chunkStore = new Map<string, { chunks: Map<number, Buffer>; totalChunks: number; metadata: any }>();

export function handleUploadChunk(req: Request, res: Response) {
  try {
    const session = (req as any).sessionRecord;
    const file = req.file;

    if (!file || !file.buffer) {
      return res.status(400).json({ error: 'No chunk payload received.' });
    }

    const fileId = req.body.fileId || generateId();
    const chunkIndex = parseInt(req.body.chunkIndex || '0', 10);
    const totalChunks = parseInt(req.body.totalChunks || '1', 10);
    const originalName = req.body.originalName || 'file';
    const mimeType = req.body.mimeType || 'application/octet-stream';
    const totalSize = parseInt(req.body.totalSize || '0', 10) || file.size;

    let transfer = chunkStore.get(fileId);
    if (!transfer) {
      transfer = {
        chunks: new Map<number, Buffer>(),
        totalChunks,
        metadata: { originalName, mimeType, totalSize }
      };
      chunkStore.set(fileId, transfer);
    }

    transfer.chunks.set(chunkIndex, file.buffer);

    // When all chunks for file received
    if (transfer.chunks.size === totalChunks) {
      const sortedBuffers: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const buf = transfer.chunks.get(i);
        if (buf) sortedBuffers.push(buf);
      }

      const combinedBuffer = Buffer.concat(sortedBuffers);
      const storedName = `${fileId}-${Date.now()}`;

      const fileRecord = createFileRecord(
        session.id,
        originalName,
        storedName,
        mimeType,
        combinedBuffer.length,
        combinedBuffer
      );

      chunkStore.delete(fileId);

      updateSessionStatus(session.id, 'READY');

      const allFiles = getSessionFiles(session.id);
      const formattedAllFiles: FileItem[] = allFiles.map(f => ({
        id: f.id,
        originalName: f.original_filename,
        mimeType: f.mime_type,
        size: f.size,
        createdAt: f.created_at,
        downloadUrl: `/api/files/${f.id}`,
        previewUrl: `/api/files/${f.id}?preview=true`
      }));

      notifyFilesReceived(session.id, formattedAllFiles, formattedAllFiles.length);

      const fileItem: FileItem = {
        id: fileRecord.id,
        originalName: fileRecord.original_filename,
        mimeType: fileRecord.mime_type,
        size: fileRecord.size,
        createdAt: fileRecord.created_at,
        downloadUrl: `/api/files/${fileRecord.id}`,
        previewUrl: `/api/files/${fileRecord.id}?preview=true`
      };

      return res.status(201).json({
        completed: true,
        file: fileItem,
        totalFiles: formattedAllFiles.length
      });
    }

    return res.json({ completed: false, receivedChunk: chunkIndex, totalChunks });
  } catch (error: any) {
    console.error('handleUploadChunk error:', error);
    return res.status(500).json({ error: error.message || 'Chunk upload failed.' });
  }
}

export function handleUploadFiles(req: Request, res: Response) {
  try {
    const session = (req as any).sessionRecord;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const savedFiles: FileItem[] = [];

    for (const file of files) {
      const storedName = file.filename || `${file.fieldname}-${Date.now()}`;
      const fileRecord = createFileRecord(
        session.id,
        file.originalname,
        storedName,
        file.mimetype || 'application/octet-stream',
        file.size,
        file.buffer
      );

      savedFiles.push({
        id: fileRecord.id,
        originalName: fileRecord.original_filename,
        mimeType: fileRecord.mime_type,
        size: fileRecord.size,
        createdAt: fileRecord.created_at,
        downloadUrl: `/api/files/${fileRecord.id}`,
        previewUrl: `/api/files/${fileRecord.id}?preview=true`
      });
    }

    updateSessionStatus(session.id, 'READY');

    const allFiles = getSessionFiles(session.id);
    const formattedAllFiles: FileItem[] = allFiles.map(f => ({
      id: f.id,
      originalName: f.original_filename,
      mimeType: f.mime_type,
      size: f.size,
      createdAt: f.created_at,
      downloadUrl: `/api/files/${f.id}`,
      previewUrl: `/api/files/${f.id}?preview=true`
    }));

    notifyFilesReceived(session.id, formattedAllFiles, formattedAllFiles.length);

    return res.status(201).json({
      success: true,
      message: `${savedFiles.length} file(s) successfully transferred to PC.`,
      files: savedFiles,
      totalFiles: formattedAllFiles.length
    });
  } catch (error: any) {
    console.error('handleUploadFiles error:', error);
    return res.status(500).json({ error: error.message || 'File upload failed.' });
  }
}

export function handleGetSessionFiles(req: Request, res: Response) {
  try {
    const token = extractStringParam(req.params.token);
    const session = getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const rawFiles = getSessionFiles(session.id);
    const files: FileItem[] = rawFiles.map(f => ({
      id: f.id,
      originalName: f.original_filename,
      mimeType: f.mime_type,
      size: f.size,
      createdAt: f.created_at,
      downloadUrl: `/api/files/${f.id}`,
      previewUrl: `/api/files/${f.id}?preview=true`
    }));

    return res.json({ files });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve session files.' });
  }
}

export function handleGetFileContent(req: Request, res: Response) {
  try {
    const fileId = extractStringParam(req.params.fileId);
    const isPreview = req.query.preview === 'true';

    const file = getFileById(fileId);
    if (!file) {
      return res.status(404).send('File not found or has been deleted.');
    }

    const buffer = getFileBuffer(fileId);
    if (!buffer) {
      return res.status(404).send('Physical file content missing.');
    }

    res.setHeader('Content-Type', file.mime_type);
    
    if (isPreview) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_filename)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
    }

    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).send('Error serving file content.');
  }
}

export function handleDeleteSingleFile(req: Request, res: Response) {
  try {
    const fileId = extractStringParam(req.params.fileId);
    const file = getFileById(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const sessionId = file.session_id;
    deleteFile(fileId);

    notifyFileDeleted(sessionId, fileId);

    return res.json({ success: true, message: 'File deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete file.' });
  }
}

export function handleDeleteAllSessionFiles(req: Request, res: Response) {
  try {
    const token = extractStringParam(req.params.token);
    const session = getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    deleteAllSessionFiles(session.id);
    updateSessionStatus(session.id, 'CONNECTED');

    notifyFilesReceived(session.id, [], 0);

    return res.json({ success: true, message: 'All files for session deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete all session files.' });
  }
}
