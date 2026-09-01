export type SessionStatus = 'WAITING' | 'CONNECTED' | 'UPLOADING' | 'READY' | 'EXPIRED' | 'CLOSED';

export interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface SessionData {
  sessionId: string;
  pcId: string;
  pin: string;
  token: string;
  qrUrl: string;
  whatsappUrl?: string;
  whatsappBotNumber?: string;
  expiresAt: string;
  durationSeconds: number;
  status: SessionStatus;
  isExpired?: boolean;
  files?: FileItem[];
}
