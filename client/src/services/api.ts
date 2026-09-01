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
  return new Promise((resolve, reject) => {
    const encodedToken = encodeURIComponent(token);
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/sessions/${encodedToken}/files`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error || 'Upload failed'));
        } catch (e) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.send(formData);
  });
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
