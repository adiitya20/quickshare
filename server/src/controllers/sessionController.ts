import { Request, Response } from 'express';
import { 
  createSession, 
  getSessionByToken, 
  updateSessionStatus, 
  getSessionFiles, 
  deleteSessionRecord 
} from '../services/sessionService';
import { deleteAllSessionFiles } from '../services/fileService';
import { 
  notifyPhoneConnected, 
  notifySessionClosed, 
  notifySessionExpired 
} from '../services/socketService';
import { config } from '../utils/config';
import { FileItem } from '../types';

function extractStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export function handleCreateSession(req: Request, res: Response) {
  try {
    const { pcId } = req.body || {};
    const { session, rawToken } = createSession(pcId);

    const fwdProto = req.headers['x-forwarded-proto'];
    const fwdHost = req.headers['x-forwarded-host'];
    const originHeader = req.headers.origin;

    const protocol = extractStringParam(fwdProto) || req.protocol || 'http';
    const host = extractStringParam(fwdHost) || req.get('host');
    const clientUrl = extractStringParam(originHeader) || `${protocol}://${host}` || config.clientOrigin;
    const qrUrl = `${clientUrl}/upload/${rawToken}`;

    return res.status(201).json({
      sessionId: session.id,
      pcId: session.pc_id,
      token: rawToken,
      qrUrl,
      expiresAt: session.expires_at,
      durationSeconds: config.sessionDurationMinutes * 60
    });
  } catch (error: any) {
    console.error('handleCreateSession error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create session' });
  }
}

export function handleGetSessionInfo(req: Request, res: Response) {
  try {
    const token = extractStringParam(req.params.token);
    const session = getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const now = new Date();
    const isExpired = new Date(session.expires_at) <= now || session.status === 'EXPIRED' || session.status === 'CLOSED';

    if (isExpired && session.status !== 'EXPIRED' && session.status !== 'CLOSED') {
      updateSessionStatus(session.id, 'EXPIRED');
      deleteAllSessionFiles(session.id);
      notifySessionExpired(session.id);
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

    return res.json({
      sessionId: session.id,
      pcId: session.pc_id,
      expiresAt: session.expires_at,
      status: isExpired ? 'EXPIRED' : session.status,
      isExpired,
      files
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch session details' });
  }
}

export function handleNotifyPhoneConnected(req: Request, res: Response) {
  try {
    const token = extractStringParam(req.params.token);
    const session = getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (new Date(session.expires_at) <= new Date() || session.status === 'EXPIRED' || session.status === 'CLOSED') {
      return res.status(410).json({ error: 'Session expired' });
    }

    if (session.status === 'WAITING') {
      updateSessionStatus(session.id, 'CONNECTED');
    }

    notifyPhoneConnected(session.id, session.pc_id);

    return res.json({ success: true, pcId: session.pc_id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to notify connection' });
  }
}

export function handleRegenerateSession(req: Request, res: Response) {
  try {
    const token = extractStringParam(req.params.token);
    const oldSession = getSessionByToken(token);

    if (oldSession) {
      deleteAllSessionFiles(oldSession.id);
      updateSessionStatus(oldSession.id, 'CLOSED');
      notifySessionClosed(oldSession.id, 'New QR code generated on PC');
    }

    const pcId = oldSession ? oldSession.pc_id : undefined;
    const { session, rawToken } = createSession(pcId);

    const fwdProto = req.headers['x-forwarded-proto'];
    const fwdHost = req.headers['x-forwarded-host'];
    const originHeader = req.headers.origin;

    const protocol = extractStringParam(fwdProto) || req.protocol || 'http';
    const host = extractStringParam(fwdHost) || req.get('host');
    const clientUrl = extractStringParam(originHeader) || `${protocol}://${host}` || config.clientOrigin;
    const qrUrl = `${clientUrl}/upload/${rawToken}`;

    return res.status(201).json({
      sessionId: session.id,
      pcId: session.pc_id,
      token: rawToken,
      qrUrl,
      expiresAt: session.expires_at,
      durationSeconds: config.sessionDurationMinutes * 60
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to regenerate session' });
  }
}

export function handleDeleteSession(req: Request, res: Response) {
  try {
    const token = extractStringParam(req.params.token);
    const session = getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    deleteAllSessionFiles(session.id);
    updateSessionStatus(session.id, 'CLOSED');
    notifySessionClosed(session.id, 'Session ended by PC user');

    return res.json({ success: true, message: 'Session closed and all files permanently deleted.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to end session' });
  }
}
