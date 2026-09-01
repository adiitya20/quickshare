import React, { useEffect, useState } from 'react';
import { FileItem } from '../types/index.js';
import { X, Printer, Download, FileText, Image as ImageIcon, FileCode, AlertCircle } from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onPrint: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onPrint }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<boolean>(false);

  useEffect(() => {
    if (file && (file.mimeType.includes('text') || file.originalName.endsWith('.txt'))) {
      setLoadingText(true);
      fetch(file.previewUrl)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Failed to load text content.');
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const ext = file.originalName.split('.').pop()?.toLowerCase();
  const isPdf = file.mimeType.includes('pdf') || ext === 'pdf';
  const isImage = file.mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
  const isText = file.mimeType.includes('text') || ext === 'txt';
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx'].includes(ext || '');

  const handleNativePrint = () => {
    if (isPdf || isImage || isText) {
      // Open hidden print frame or print window
      const printWin = window.open(file.previewUrl, '_blank');
      if (printWin) {
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 500);
      } else {
        onPrint(file);
      }
    } else {
      onPrint(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 shrink-0">
              {isPdf && <FileText className="w-6 h-6 text-rose-600" />}
              {isImage && <ImageIcon className="w-6 h-6 text-indigo-600" />}
              {isText && <FileCode className="w-6 h-6 text-emerald-600" />}
              {isOfficeDoc && <FileText className="w-6 h-6 text-blue-600" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{file.originalName}</h3>
              <p className="text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleNativePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print File</span>
            </button>

            <a
              href={file.downloadUrl}
              download={file.originalName}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              title="Download to PC"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Preview Area */}
        <div className="flex-1 bg-slate-900 overflow-auto p-4 flex items-center justify-center min-h-[400px]">
          {isPdf && (
            <iframe
              src={`${file.previewUrl}#toolbar=1`}
              className="w-full h-[65vh] rounded-lg border-0 shadow-lg"
              title={file.originalName}
            />
          )}

          {isImage && (
            <div className="max-h-[65vh] flex items-center justify-center">
              <img
                src={file.previewUrl}
                alt={file.originalName}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>
          )}

          {isText && (
            <div className="w-full h-[65vh] bg-slate-950 text-slate-100 p-6 rounded-lg font-mono text-xs overflow-auto border border-slate-800 leading-relaxed">
              {loadingText ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Loading text content...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono">{textContent}</pre>
              )}
            </div>
          )}

          {isOfficeDoc && (
            <div className="bg-slate-800 text-slate-100 p-8 rounded-2xl max-w-md text-center border border-slate-700 shadow-2xl">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">Office Document Preview</h4>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Word and PowerPoint files require Microsoft Office or a desktop app to print directly. You can download the file to this PC or open it in your browser.
              </p>
              <div className="flex justify-center space-x-3">
                <a
                  href={file.downloadUrl}
                  download={file.originalName}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-lg transition-transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File to PC</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Click "Print File" to open the system printer selection dialog.</span>
          <button
            onClick={onClose}
            className="font-semibold text-slate-700 hover:text-slate-900"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
