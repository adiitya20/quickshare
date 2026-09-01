import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SessionStatusIndicator } from './SessionStatusIndicator.js';
import { SessionStatus } from '../types/index.js';
import { RefreshCw, Clock, Monitor, Copy, Check } from 'lucide-react';

interface QRDisplayProps {
  qrUrl: string;
  pcId: string;
  expiresAt: string;
  status: SessionStatus;
  receivedCount: number;
  onRegenerate: () => void;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  qrUrl,
  pcId,
  expiresAt,
  status,
  receivedCount,
  onRegenerate
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = timeLeft === 0 || status === 'EXPIRED' || status === 'CLOSED';

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200/80 text-center flex flex-col items-center justify-between relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="w-full mb-4">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Scan with Phone</h2>
        <p className="text-xs text-slate-500 mt-1">Open camera to upload documents directly to this PC</p>
      </div>

      {/* QR Code Container */}
      <div className="relative my-2 p-5 bg-slate-50 border-2 border-slate-200/80 rounded-2xl shadow-inner group">
        {isExpired ? (
          <div className="w-64 h-64 flex flex-col items-center justify-center p-6 bg-slate-100/90 backdrop-blur-sm rounded-xl text-center">
            <Clock className="w-12 h-12 text-slate-400 mb-3" />
            <p className="font-bold text-slate-800 text-sm">Session Expired</p>
            <p className="text-xs text-slate-500 mb-4">Files deleted. Generate a new QR code to continue.</p>
            <button
              onClick={onRegenerate}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate New QR</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <QRCodeSVG
              value={qrUrl}
              size={240}
              level="H"
              includeMargin={true}
              className="rounded-lg shadow-sm"
            />
            {status === 'WAITING' && (
              <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-amber-400/40 animate-pulse-ring" />
            )}
          </div>
        )}
      </div>

      {/* Target PC & Timer Info */}
      <div className="w-full mt-4 space-y-3">
        <div className="flex items-center justify-between text-xs px-4 py-2.5 bg-slate-100 rounded-xl font-medium border border-slate-200">
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Monitor className="w-4 h-4 text-brand-600" />
            <span>PC: <strong>{pcId}</strong></span>
          </div>
          <div className={`flex items-center space-x-1 font-mono font-bold ${timeLeft < 120 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>Session expires in: {formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="pt-1 flex items-center justify-center">
          <SessionStatusIndicator status={status} receivedCount={receivedCount} />
        </div>

        {/* Controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-3 text-xs">
          <button
            onClick={onRegenerate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors font-medium"
            title="Destroys active session, deletes files, and creates new QR token"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New QR</span>
          </button>

          <span className="text-slate-300">•</span>

          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors font-medium"
            title="Copy mobile upload link for testing"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Mobile Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
