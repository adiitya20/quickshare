import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '../components/Header.js';
import { QRDisplay } from '../components/QRDisplay.js';
import { FileList } from '../components/FileList.js';
import { FilePreviewModal } from '../components/FilePreviewModal.js';
import { PrivacyBadge } from '../components/PrivacyBadge.js';
import { 
  createSession, 
  getSessionInfo,
  regenerateSession, 
  deleteSingleFile, 
  deleteAllFiles 
} from '../services/api.js';
import { getSocket, joinPCSessionRoom } from '../services/socket.js';
import { SessionData, FileItem, SessionStatus } from '../types/index.js';

export const PCSession: React.FC = () => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<SessionStatus>('WAITING');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshingFiles, setIsRefreshingFiles] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize a fresh PC Session every time the page loads/mounts
  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Create a fresh unique session
      const data = await createSession();
      setSession(data);
      setStatus(data.status || 'WAITING');
      setFiles([]);
      joinPCSessionRoom(data.token);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Setup Socket listeners for instant local WebSocket sync
  useEffect(() => {
    if (!session) return;

    const socket = getSocket();

    const handlePhoneConnected = (data: { pcId: string }) => {
      setStatus((prev) => (prev === 'WAITING' ? 'CONNECTED' : prev));
    };

    const handleFilesReceived = (data: { files: FileItem[]; totalFiles: number }) => {
      setFiles(data.files);
      setStatus('READY');
    };

    const handleFileDeleted = (data: { fileId: string }) => {
      setFiles((prev) => prev.filter((f) => f.id !== data.fileId));
    };

    const handleSessionExpired = () => {
      setStatus('EXPIRED');
    };

    const handleSessionClosed = () => {
      setStatus('CLOSED');
    };

    socket.on('phone_connected', handlePhoneConnected);
    socket.on('files_received', handleFilesReceived);
    socket.on('file_deleted', handleFileDeleted);
    socket.on('session_expired', handleSessionExpired);
    socket.on('session_closed', handleSessionClosed);

    return () => {
      socket.off('phone_connected', handlePhoneConnected);
      socket.off('files_received', handleFilesReceived);
      socket.off('file_deleted', handleFileDeleted);
      socket.off('session_expired', handleSessionExpired);
      socket.off('session_closed', handleSessionClosed);
    };
  }, [session]);

  // Real-time polling fallback for Vercel Serverless Function compatibility (polls every 2 seconds)
  useEffect(() => {
    if (!session || status === 'EXPIRED' || status === 'CLOSED') return;

    const pollInterval = setInterval(async () => {
      try {
        const updated = await getSessionInfo(session.token);
        if (updated) {
          if (updated.files && Array.isArray(updated.files)) {
            const fetchedFiles = updated.files;
            setFiles((prevFiles) => {
              const currentJson = JSON.stringify(prevFiles);
              const fetchedJson = JSON.stringify(fetchedFiles);
              return currentJson === fetchedJson ? prevFiles : fetchedFiles;
            });
          }
          if (updated.status && updated.status !== status) {
            setStatus(updated.status);
          }
        }
      } catch (e) {
        // Quietly ignore network glitches during background polling
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [session, status]);

  // Dedicated Refresh Handler for Received Files Section Only (without reloading page or changing QR)
  const handleManualRefreshFiles = async () => {
    if (!session) return;
    setIsRefreshingFiles(true);
    try {
      const updated = await getSessionInfo(session.token);
      if (updated) {
        if (updated.files && Array.isArray(updated.files)) {
          setFiles(updated.files);
        }
        if (updated.status && updated.status !== status) {
          setStatus(updated.status);
        }
      }
    } catch (err: any) {
      console.error('Manual file refresh error:', err);
    } finally {
      setIsRefreshingFiles(false);
    }
  };

  const handleRegenerate = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await regenerateSession(session.token);
      setSession(data);
      setStatus('WAITING');
      setFiles([]);
      joinPCSessionRoom(data.token);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteSingleFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const handleDeleteAll = async () => {
    if (!session) return;
    if (!confirm('Are you sure you want to delete all uploaded files?')) return;
    try {
      await deleteAllFiles(session.token);
      setFiles([]);
      setStatus('CONNECTED');
    } catch (err: any) {
      alert(err.message || 'Failed to delete all files');
    }
  };

  const handlePrintFile = (file: FileItem) => {
    const ext = file.originalName.split('.').pop()?.toLowerCase();
    const isPrintableDirectly = file.mimeType.includes('pdf') || file.mimeType.includes('image') || file.mimeType.includes('text') || ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt'].includes(ext || '');

    if (isPrintableDirectly) {
      const printWindow = window.open(file.previewUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        setPreviewFile(file);
      }
    } else {
      setPreviewFile(file);
    }
  };

  const handlePrintAll = () => {
    if (files.length === 0) return;
    handlePrintFile(files[0]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header pcId={session?.pcId} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Large QR Display */}
          <div className="lg:col-span-5">
            {loading || !session ? (
              <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-600">Generating Secure Unique QR Session...</p>
              </div>
            ) : (
              <QRDisplay
                qrUrl={session.qrUrl}
                pcId={session.pcId}
                expiresAt={session.expiresAt}
                status={status}
                receivedCount={files.length}
                onRegenerate={handleRegenerate}
              />
            )}
          </div>

          {/* Right Column: Received Files Dashboard */}
          <div className="lg:col-span-7 h-full">
            <FileList
              files={files}
              onPreview={(f) => setPreviewFile(f)}
              onPrint={handlePrintFile}
              onDelete={handleDeleteFile}
              onPrintAll={handlePrintAll}
              onDeleteAll={handleDeleteAll}
              onRefresh={handleManualRefreshFiles}
              isRefreshing={isRefreshingFiles}
            />
          </div>
        </div>

        {/* Bottom Privacy Callout */}
        <PrivacyBadge />
      </main>

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onPrint={handlePrintFile}
      />
    </div>
  );
};
