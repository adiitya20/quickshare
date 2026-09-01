import React from 'react';
import { Lock, Clock, Trash2, ShieldAlert } from 'lucide-react';

export const PrivacyBadge: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-white">Your Privacy Is Guaranteed</h3>
          <p className="text-xs text-slate-400">Zero personal accounts or persistent file storage on this PC</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="flex items-start space-x-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">No Accounts</span>
            <span className="text-slate-400">No WhatsApp, Email, or Google login required on this public PC.</span>
          </div>
        </div>

        <div className="flex items-start space-x-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Temporary Session</span>
            <span className="text-slate-400">Unique QR token expires automatically after printing session ends.</span>
          </div>
        </div>

        <div className="flex items-start space-x-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Auto-Cleanup</span>
            <span className="text-slate-400">All uploaded documents are permanently purged from server upon session expiry.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
