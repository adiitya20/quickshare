import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  createFileRecord, 
  getFileById, 
  deleteFile, 
  deleteAllSessionFiles 
} from '../services/fileService.js';
import { 
  getSessionByToken, 
  getSessionFiles, 
  updateSessionStatus 
} from '../services/sessionService.js';
import { notifyFilesReceived, notifyFileDeleted } from '../services/socketService.js';
import { config } from '../utils/config.js';
import { FileItem } from '../types/index.js';

export function handleUploadFiles(req: Request, res: Response) {
  try {
    const session = (req as any).sessionRecord;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const savedFiles: FileItem[] = [];

    for (const file of files) {
      const fileRecord = createFileRecord(
        session.id,
        file.originalname,
        file.filename,
        file.mimetype || 'application/octet-stream',
        file.size
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

    // Update status to READY
    updateSessionStatus(session.id, 'READY');

    // Get updated total files count for session
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

    // Emit Socket.IO notification to PC
    notifyFilesReceived(session.id, formattedAllFiles, formattedAllFiles.length);

    return res.status(201).json({
      success: true,
      message: `${savedFiles.length} file(s) successfully transferred to PC.`,
      files: savedFiles,
      totalFiles: formattedAllFiles.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'File upload failed.' });
  }
}

export function handleGetSessionFiles(req: Request, res: Response) {
  try {
    const { token } = req.params;
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
    const { fileId } = req.params;
    const isPreview = req.query.preview === 'true';

    const file = getFileById(fileId);
    if (!file) {
      return res.status(404).send('File not found or has been deleted.');
    }

    const filePath = path.join(config.uploadDir, file.session_id, file.stored_filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Physical file missing.');
    }

    res.setHeader('Content-Type', file.mime_type);
    
    if (isPreview) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_filename)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
    }

    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (error: any) {
    return res.status(500).send('Error serving file content.');
  }
}

export function handleDeleteSingleFile(req: Request, res: Response) {
  try {
    const { fileId } = req.params;
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
    const { token } = req.params;
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
