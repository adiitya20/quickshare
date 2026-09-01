import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SessionStatusIndicator } from './SessionStatusIndicator.js';
import { SessionStatus } from '../types/index.js';
import { RefreshCw, Clock, Monitor, Copy, Check, MessageSquare, QrCode, ExternalLink, Send, Info, Share2, FolderDown } from 'lucide-react';
import { simulateWhatsappForward } from '../services/api.js';

interface QRDisplayProps {
  qrUrl: string;
  pcId: string;
  pin?: string;
  whatsappUrl?: string;
  expiresAt: string;
  status: SessionStatus;
  receivedCount: number;
  onRegenerate: () => void;
}

export const QRDisplay: React.FC<QRDisplayProps> = ({
  qrUrl,
  pcId,
  pin = '1234',
  whatsappUrl,
  expiresAt,
  status,
  receivedCount,
  onRegenerate
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'whatsapp'>('qr');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [pinCopied, setPinCopied] = useState<boolean>(false);
  
  // WhatsApp simulation state
  const [simText, setSimText] = useState<string>('');
  const [simSending, setSimSending] = useState<boolean>(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

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

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleSimulateSend = async () => {
    if (!simText.trim()) return;
    setSimSending(true);
    setSimSuccess(null);
    try {
      await simulateWhatsappForward(pin, 'WhatsApp_Doc.pdf', simText.trim());
      setSimSuccess('File sent to PC via WhatsApp!');
      setSimText('');
    } catch (e: any) {
      alert(e.message || 'WhatsApp forward failed');
    } finally {
      setSimSending(false);
    }
  };

  const isExpired = timeLeft === 0 || status === 'EXPIRED' || status === 'CLOSED';
  const defaultWaLink = whatsappUrl || `https://wa.me/14155238886?text=CONNECT%20${pin}`;

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200/80 text-center flex flex-col items-center justify-between relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Switcher Tabs */}
      <div className="w-full bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex items-center mb-5">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'qr'
              ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Web Camera QR</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Easy Share</span>
        </button>
      </div>

      {activeTab === 'qr' ? (
        /* Standard Web QR Mode */
        <>
          <div className="w-full mb-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Scan with Phone</h2>
            <p className="text-xs text-slate-500 mt-1">Open camera to upload documents directly to this PC</p>
          </div>

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
        </>
      ) : (
        /* WhatsApp Direct Sharing Mode */
        <div className="w-full my-2 space-y-4 text-left bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Instant Shortcuts</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Zero Login
            </span>
          </div>

          {/* 4-Digit Session PIN */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200 text-center space-y-1 shadow-sm">
            <p className="text-[11px] text-slate-500 font-medium">Session PIN Code</p>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl font-black tracking-widest text-slate-900 font-mono bg-slate-100 px-4 py-1 rounded-lg border border-slate-200">
                {pin}
              </span>
              <button
                onClick={handleCopyPin}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Copy PIN"
              >
                {pinCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2 Easy WhatsApp Features */}
          <div className="text-xs text-slate-700 space-y-2.5">
            <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
              <p className="font-extrabold text-emerald-900 flex items-center space-x-1.5 text-xs">
                <FolderDown className="w-4 h-4 text-emerald-600" />
                <span>1. WhatsApp Document Picker (1-Click)</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Scan QR code with phone camera ➔ Tap <strong>"📁 Pick File Received on WhatsApp"</strong> to browse downloaded files instantly.
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
              <p className="font-extrabold text-brand-900 flex items-center space-x-1.5 text-xs">
                <Share2 className="w-4 h-4 text-brand-600" />
                <span>2. Share Menu Integration</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                In WhatsApp, open any file ➔ Tap <strong>Share</strong> ➔ Select <strong>QrShareIt</strong> to send directly to this PC!
              </p>
            </div>
          </div>

          {/* Quick Simulation Input for Instant Web Test */}
          <div className="pt-3 border-t border-emerald-200/60 space-y-2">
            <p className="text-[11px] font-bold text-slate-700">Quick Test Forward (Simulate WhatsApp):</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Paste text note or doc title..."
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulateSend()}
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                onClick={handleSimulateSend}
                disabled={simSending || !simText.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
            {simSuccess && (
              <p className="text-[11px] text-emerald-700 font-bold text-center animate-fade-in">
                ✓ {simSuccess}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Target PC & Timer Info */}
      <div className="w-full mt-4 space-y-3">
        <div className="flex items-center justify-between text-xs px-4 py-2.5 bg-slate-100 rounded-xl font-medium border border-slate-200">
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Monitor className="w-4 h-4 text-brand-600" />
            <span>PC: <strong>{pcId}</strong></span>
          </div>
          <div className={`flex items-center space-x-1 font-mono font-bold ${timeLeft < 120 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>Expires in: {formatTimer(timeLeft)}</span>
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
