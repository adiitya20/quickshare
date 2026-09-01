import { Request, Response } from 'express';
import { getSessionByPin, getSessionFiles, updateSessionStatus } from '../services/sessionService';
import { createFileRecord } from '../services/fileService';
import { notifyFilesReceived, notifyPhoneConnected } from '../services/socketService';
import { FileItem } from '../types';

/**
 * Handle incoming WhatsApp Webhook / Simulated WhatsApp message
 */
export function handleWhatsappWebhook(req: Request, res: Response) {
  try {
    const { pin, fileName, mimeType, fileBase64, textContent } = req.body || {};

    if (!pin) {
      return res.status(400).json({ error: 'Session PIN is required to forward file via WhatsApp.' });
    }

    const session = getSessionByPin(pin.trim());
    if (!session) {
      return res.status(404).json({ error: `No active PC session found for PIN ${pin}. Check PC screen.` });
    }

    updateSessionStatus(session.id, 'READY');
    notifyPhoneConnected(session.id, session.pc_id);

    let createdFileItem: FileItem | null = null;

    if (fileBase64 || textContent || fileName) {
      const buffer = fileBase64 
        ? Buffer.from(fileBase64, 'base64') 
        : Buffer.from(textContent || 'WhatsApp Forwarded Note');

      const originalName = fileName || (textContent ? 'WhatsApp_Note.txt' : 'WhatsApp_Doc.pdf');
      const resolvedMime = mimeType || (textContent ? 'text/plain' : 'application/pdf');

      const fileRecord = createFileRecord(
        session.id,
        originalName,
        `wa-${Date.now()}-${originalName}`,
        resolvedMime,
        buffer.length,
        buffer
      );

      createdFileItem = {
        id: fileRecord.id,
        originalName: fileRecord.original_filename,
        mimeType: fileRecord.mime_type,
        size: fileRecord.size,
        createdAt: fileRecord.created_at,
        downloadUrl: `/api/files/${fileRecord.id}`,
        previewUrl: `/api/files/${fileRecord.id}?preview=true`
      };
    }

    const allFiles = getSessionFiles(session.id);
    const formattedFiles: FileItem[] = allFiles.map(f => ({
      id: f.id,
      originalName: f.original_filename,
      mimeType: f.mime_type,
      size: f.size,
      createdAt: f.created_at,
      downloadUrl: `/api/files/${f.id}`,
      previewUrl: `/api/files/${f.id}?preview=true`
    }));

    notifyFilesReceived(session.id, formattedFiles, formattedFiles.length);

    return res.status(201).json({
      success: true,
      message: `Document successfully forwarded to PC ${session.pc_id} via WhatsApp!`,
      file: createdFileItem,
      totalFiles: formattedFiles.length
    });
  } catch (error: any) {
    console.error('handleWhatsappWebhook error:', error);
    return res.status(500).json({ error: error.message || 'WhatsApp message processing failed.' });
  }
}
