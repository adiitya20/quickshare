import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { PrivacyBadge } from '../components/PrivacyBadge.js';
import { QrCode, UploadCloud, Printer, ShieldCheck, ArrowRight, Monitor, Smartphone, Lock } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartPCSession = () => {
    navigate('/pc');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs sm:text-sm font-semibold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Secure College Lab Document Transfer</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Print from your phone.{' '}
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              No login required.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Scan the QR code displayed on your college computer, upload your documents directly from your phone, and print them instantly. No WhatsApp login. No email login. No personal credentials saved on shared PCs.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartPCSession}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Monitor className="w-5 h-5" />
              <span>Start PC Printing Session</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>

        {/* 3 Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-lg relative overflow-hidden group hover:border-brand-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xl mb-6 border border-brand-100 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-brand-600" />
              <span>1. Scan QR Code</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Open the QrShareIt website on your college computer. A temporary, unique QR code will appear on the screen immediately.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-lg relative overflow-hidden group hover:border-brand-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl mb-6 border border-indigo-100 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>2. Upload Documents</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scan the QR code using your phone's camera. Select your PDFs, Word files, photos, or PPTs to transfer them directly to that PC.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-lg relative overflow-hidden group hover:border-brand-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <Printer className="w-5 h-5 text-emerald-600" />
              <span>3. Preview & Print</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Files appear on the PC screen in real time. Preview, print to the college printer, and walk away. Files auto-delete upon session end.
            </p>
          </div>
        </div>

        {/* Security & Privacy Section */}
        <div className="pt-4">
          <PrivacyBadge />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 QrShareIt — College Lab Printing Utility. All rights reserved.</p>
      </footer>
    </div>
  );
};
