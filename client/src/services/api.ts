import { SessionData, FileItem } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function createSession(pcId?: string): Promise<SessionData> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pcId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create PC session');
  }

  return response.json();
}

export async function getSessionInfo(token: string): Promise<SessionData> {
  const encodedToken = encodeURIComponent(token);
  const response = await fetch(`${API_BASE}/sessions/${encodedToken}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Session expired or not found');
  }

  return response.json();
}

export async function notifyPhoneConnected(token: string): Promise<{ success: boolean; pcId: string }> {
  const encodedToken = encodeURIComponent(token);
  const response = await fetch(`${API_BASE}/sessions/${encodedToken}/notify-connected`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to notify connection');
  }

  return response.json();
}

export async function regenerateSession(token: string): Promise<SessionData> {
  const encodedToken = encodeURIComponent(token);
  const response = await fetch(`${API_BASE}/sessions/${encodedToken}/regenerate`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to regenerate session');
  }

  return response.json();
}

export async function deleteSession(token: string): Promise<void> {
  const encodedToken = encodeURIComponent(token);
  await fetch(`${API_BASE}/sessions/${encodedToken}`, { method: 'DELETE' });
}

export async function uploadFiles(
  token: string,
  files: File[],
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; files: FileItem[]; totalFiles: number }> {
  const CHUNK_SIZE = 1.5 * 1024 * 1024;
  const encodedToken = encodeURIComponent(token);

  let totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  let totalUploadedBytes = 0;
  const resultFiles: FileItem[] = [];
  let lastTotalFilesCount = 0;

  for (const file of files) {
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append('fileId', fileId);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('originalName', file.name);
      formData.append('mimeType', file.type || 'application/octet-stream');
      formData.append('totalSize', file.size.toString());
      formData.append('chunk', chunkBlob, file.name);

      const response = await fetch(`${API_BASE}/sessions/${encodedToken}/files/chunk`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload failed for ${file.name} (Status ${response.status})`);
      }

      const resData = await response.json();
      totalUploadedBytes += (end - start);

      if (onProgress && totalBytes > 0) {
        onProgress(Math.min(99, Math.round((totalUploadedBytes / totalBytes) * 100)));
      }

      if (resData.completed && resData.file) {
        resultFiles.push(resData.file);
        if (resData.totalFiles) lastTotalFilesCount = resData.totalFiles;
      }
    }
  }

  if (onProgress) onProgress(100);

  return {
    success: true,
    files: resultFiles,
    totalFiles: lastTotalFilesCount || resultFiles.length
  };
}

export async function simulateWhatsappForward(
  pin: string,
  fileName: string,
  textContent?: string,
  fileBase64?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/whatsapp/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, fileName, textContent, fileBase64 })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'WhatsApp forward failed');
  }

  return response.json();
}

export async function deleteSingleFile(fileId: string): Promise<void> {
  const encodedId = encodeURIComponent(fileId);
  const response = await fetch(`${API_BASE}/files/${encodedId}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete file');
  }
}

export async function deleteAllFiles(token: string): Promise<void> {
  const encodedToken = encodeURIComponent(token);
  const response = await fetch(`${API_BASE}/sessions/${encodedToken}/files`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete all files');
  }
}
