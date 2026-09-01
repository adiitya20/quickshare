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
import { Monitor, RefreshCw } from 'lucide-react';

export const PCSession: React.FC = () => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [pcId, setPcId] = useState<string>('LAB 01 / COMPUTER-04');
  const [status, setStatus] = useState<SessionStatus>('WAITING');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize PC Session
  const initSession = useCallback(async (customPcId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createSession(customPcId || pcId);
      setSession(data);
      setStatus(data.status || 'WAITING');
      setFiles([]);
      joinPCSessionRoom(data.token);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize session.');
    } finally {
      setLoading(false);
    }
  }, [pcId]);

  useEffect(() => {
    initSession();
  }, []);

  // Setup Socket listeners
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
    // Open preview of first file or open concatenated preview
    handlePrintFile(files[0]);
  };

  const handlePcIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setPcId(newId);
    initSession(newId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header pcId={session?.pcId} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Top PC Settings Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">College PC Location</span>
              <select
                value={pcId}
                onChange={handlePcIdChange}
                className="font-bold text-slate-900 text-sm bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
              >
                <option value="LAB 01 / COMPUTER-04">LAB 01 / COMPUTER-04</option>
                <option value="LAB 01 / COMPUTER-12">LAB 01 / COMPUTER-12</option>
                <option value="LAB 02 / COMPUTER-08">LAB 02 / COMPUTER-08</option>
                <option value="LIBRARY / PC-02">LIBRARY / PC-02</option>
                <option value="MAIN HALL / PC-15">MAIN HALL / PC-15</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRegenerate}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Printing Session</span>
            </button>
          </div>
        </div>

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
                <p className="text-sm font-semibold text-slate-600">Generating Secure QR Session...</p>
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
