export type SessionStatus = 'WAITING' | 'CONNECTED' | 'UPLOADING' | 'READY' | 'EXPIRED' | 'CLOSED';

export interface SessionRecord {
  id: string;
  pc_id: string;
  pin: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  status: SessionStatus;
}

export interface FileRecord {
  id: string;
  session_id: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  size: number;
  created_at: string;
}

export interface CreateSessionRequest {
  pcId?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  pcId: string;
  pin: string;
  token: string;
  qrUrl: string;
  whatsappUrl: string;
  whatsappBotNumber: string;
  expiresAt: string;
  durationSeconds: number;
}

export interface SessionInfoResponse {
  sessionId: string;
  pcId: string;
  pin: string;
  expiresAt: string;
  status: SessionStatus;
  isExpired: boolean;
  files: FileItem[];
}

export interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
  previewUrl: string;
}

export interface SocketEvents {
  join_pc_session: (data: { token: string }) => void;
  phone_connected: (data: { pcId: string; timestamp: string }) => void;
  files_received: (data: { files: FileItem[]; totalFiles: number }) => void;
  session_expired: (data: { reason: string }) => void;
  session_closed: (data: { reason: string }) => void;
  file_deleted: (data: { fileId: string }) => void;
}
