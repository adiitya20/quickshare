import React from 'react';
import { SessionStatus } from '../types/index.js';
import { Radio, Smartphone, FileUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface SessionStatusIndicatorProps {
  status: SessionStatus;
  receivedCount?: number;
}

export const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({ status, receivedCount = 0 }) => {
  switch (status) {
    case 'WAITING':
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
          <Radio className="w-4 h-4 animate-pulse text-amber-600" />
          <span>Waiting for phone...</span>
        </div>
      );

    case 'CONNECTED':
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-brand-700 border border-blue-200 text-xs font-semibold">
          <Smartphone className="w-4 h-4 text-brand-600 animate-bounce" />
          <span>Phone connected ✓</span>
        </div>
      );

    case 'UPLOADING':
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
          <FileUp className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Receiving files...</span>
        </div>
      );

    case 'READY':
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{receivedCount} file{receivedCount === 1 ? '' : 's'} ready to print</span>
        </div>
      );

    case 'EXPIRED':
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Session Expired</span>
        </div>
      );

    case 'CLOSED':
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold">
          <XCircle className="w-4 h-4 text-slate-500" />
          <span>Session Closed</span>
        </div>
      );

    default:
      return null;
  }
};
