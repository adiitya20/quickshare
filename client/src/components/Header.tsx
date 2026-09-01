import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, ShieldCheck, Monitor, Smartphone } from 'lucide-react';

interface HeaderProps {
  pcId?: string;
  isMobile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ pcId, isMobile = false }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-800 bg-clip-text text-transparent">
              QRPrint
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-brand-700 font-medium border border-blue-100">
              College Lab Printing
            </span>
          </div>
        </Link>

        {pcId && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700">
            {isMobile ? <Smartphone className="w-4 h-4 text-brand-600" /> : <Monitor className="w-4 h-4 text-brand-600" />}
            <span>Target: <strong className="text-slate-900">{pcId}</strong></span>
          </div>
        )}

        <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center space-x-1 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline">No Login • Temporary Storage</span>
            <span className="md:hidden">No Login</span>
          </div>
        </div>
      </div>
    </header>
  );
};
