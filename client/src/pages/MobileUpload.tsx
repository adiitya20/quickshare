import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { getSessionInfo, notifyPhoneConnected, uploadFiles } from '../services/api.js';
import { SessionData, FileItem } from '../types/index.js';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  FileSpreadsheet, 
  File, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Lock, 
  Smartphone,
  FolderDown,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const MobileUpload: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showWaGuide, setShowWaGuide] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      setInitError('Invalid upload link or missing token.');
      setLoading(false);
      return;
    }

    const initMobileUpload = async () => {
      setLoading(true);
      setInitError(null);
      try {
        const sessionData = await getSessionInfo(token);
        setSession(sessionData);

        if (sessionData.isExpired) {
          setInitError('This QR code session has expired. Please scan the new QR code displayed on the computer.');
        } else {
          await notifyPhoneConnected(token).catch(() => {});
        }
      } catch (err: any) {
        setInitError(err.message || 'This QR code has expired or is invalid. Please scan a new QR code.');
      } finally {
        setLoading(false);
      }
    };

    initMobileUpload();
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      const blockedExts = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.vbs', '.msi'];
      const validFiles = newFiles.filter((f) => {
        const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
        return !blockedExts.includes(ext);
      });

      if (validFiles.length < newFiles.length) {
        alert('Executable files (.exe, .js, .bat) are blocked for security reasons.');
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setUploadSuccess(false);
      setUploadError(null);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!token || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const result = await uploadFiles(token, selectedFiles, (percent) => {
        setUploadProgress(percent);
      });

      setUploadedFiles(result.files);
      setUploadSuccess(true);
      setSelectedFiles([]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-600" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (['ppt', 'pptx'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
    if (ext === 'txt') return <FileCode className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mb-4" />
        <p className="font-semibold text-slate-700 text-sm">Connecting to PC Session...</p>
      </div>
    );
  }

  if (initError || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header isMobile />
        <main className="flex-1 max-w-md mx-auto px-4 py-12 flex items-center justify-center w-full">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center w-full space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">QR Code Expired</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {initError || 'This QR token is no longer active.'}
            </p>
            <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Please check the college PC screen and scan the newly generated QR code.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const ACCEPT_TYPES = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*,text/plain,.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header pcId={session.pcId} isMobile />

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 w-full space-y-6">
        {/* Mobile Header Banner */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Connected to PC</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Send Files to PC</h1>
          <p className="text-xs text-slate-500">
            Target PC: <strong className="text-slate-900">{session.pcId}</strong>
          </p>
        </div>

        {/* Upload Failure Alert Box */}
        {uploadError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-xs space-y-1 animate-fade-in flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Upload Error</span>
              <span>{uploadError}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {uploadSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-800 space-y-2 text-center animate-fade-in shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-extrabold text-base">Files successfully sent to PC ✓</h3>
            <p className="text-xs text-emerald-700">
              Your uploaded documents are now ready to print on <strong>{session.pcId}</strong>.
            </p>
          </div>
        )}

        {/* Accessible Native File Inputs */}
        <input
          id="main-file-input"
          type="file"
          onChange={handleFileSelect}
          multiple
          accept={ACCEPT_TYPES}
          style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
        />

        <input
          id="whatsapp-file-input"
          type="file"
          onChange={handleFileSelect}
          multiple
          accept={ACCEPT_TYPES}
          style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
        />

        {/* Select Files & WhatsApp Shortcut Buttons */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 space-y-3 text-center">
          {/* Main Select Files Label Trigger */}
          <label
            htmlFor="main-file-input"
            className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-base shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer select-none"
          >
            <Plus className="w-5 h-5" />
            <span>+ Select Files from Phone</span>
          </label>

          {/* WhatsApp Document Shortcut Label Trigger */}
          <label
            htmlFor="whatsapp-file-input"
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer select-none"
          >
            <FolderDown className="w-4 h-4" />
            <span>📁 Pick File Received on WhatsApp</span>
          </label>

          {/* Quick Guide for WhatsApp Documents */}
          <div className="pt-2">
            <button
              onClick={() => setShowWaGuide(!showWaGuide)}
              className="text-xs text-slate-600 hover:text-brand-600 font-semibold inline-flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showWaGuide ? 'Hide WhatsApp Tip' : '💡 How to find your WhatsApp document in 2 seconds?'}</span>
            </button>

            {showWaGuide && (
              <div className="mt-3 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-left text-xs text-slate-700 space-y-2 animate-fade-in">
                <p className="font-extrabold text-emerald-950 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2-Second WhatsApp File Retrieval:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 leading-relaxed">
                  <li>Tap the green <strong>"📁 Pick File Received on WhatsApp"</strong> button above.</li>
                  <li>When the file picker opens, tap <strong>"Recent"</strong> or <strong>"Documents"</strong> at the top.</li>
                  <li>Your downloaded WhatsApp PDF/Doc will be right at the top of the list!</li>
                </ol>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 font-medium pt-1">
            Supported formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP, TXT
          </p>
        </div>

        {/* Queue of Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Selected Files ({selectedFiles.length})
              </h3>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFile(idx)}
                    disabled={uploading}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Uploading to PC...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload CTA */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Transferring Files...' : 'Upload Files to PC'}</span>
            </button>
          </div>
        )}

        {/* Mobile Security Footer */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 text-xs space-y-2 shadow-lg border border-slate-800">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Lock className="w-4 h-4" />
            <span>Privacy Guaranteed</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            No personal account or WhatsApp login required. Files are sent securely over an encrypted session and auto-deleted once printed.
          </p>
        </div>
      </main>
    </div>
  );
};
