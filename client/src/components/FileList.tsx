import React from 'react';
import { FileItem } from '../types/index.js';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  FileSpreadsheet, 
  File, 
  Printer, 
  Trash2, 
  Eye, 
  CheckCircle,
  Inbox
} from 'lucide-react';

interface FileListProps {
  files: FileItem[];
  onPreview: (file: FileItem) => void;
  onPrint: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
  onPrintAll: () => void;
  onDeleteAll: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onPreview,
  onPrint,
  onDelete,
  onPrintAll,
  onDeleteAll
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (mimeType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    }
    if (['doc', 'docx'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (['ppt', 'pptx'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
    }
    if (mimeType.includes('text') || ext === 'txt') {
      return <FileCode className="w-5 h-5 text-emerald-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Received Files</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">
              {files.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Files sent from connected phone appear here in real time</p>
        </div>

        {files.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrintAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print All ({files.length})</span>
            </button>

            <button
              onClick={onDeleteAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-x-auto">
        {files.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Waiting for files...</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Scan the QR code on the left with your phone to upload PDFs, Word docs, photos, or text notes directly to this PC.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">File Name</th>
                <th className="py-3.5 px-4 text-right">Size</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                        {getFileIcon(file.mimeType, file.originalName)}
                      </div>
                      <div className="min-w-0 max-w-xs sm:max-w-md">
                        <p className="font-semibold text-slate-900 truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Uploaded {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-right font-mono text-slate-600 text-xs">
                    {formatFileSize(file.size)}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Ready</span>
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onPreview(file)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      title="Preview file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>

                    <button
                      onClick={() => onPrint(file)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Print document"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => onDelete(file.id)}
                      className="inline-flex items-center space-x-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete file permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
