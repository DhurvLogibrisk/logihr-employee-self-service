import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-sm w-full py-2.5 px-3.5 rounded-xl border shadow-xl flex items-center gap-2.5 backdrop-blur-md text-xs font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-200 ${
              isSuccess
                ? 'bg-[#102a24]/95 border-emerald-600/50 text-emerald-200 shadow-emerald-950/40'
                : isError
                ? 'bg-[#331417]/95 border-rose-600/50 text-rose-200 shadow-rose-950/40'
                : isWarning
                ? 'bg-[#332514]/95 border-amber-600/50 text-amber-200 shadow-amber-950/40'
                : 'bg-[#18233e]/95 border-blue-600/50 text-blue-200 shadow-blue-950/40'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {isError && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {isWarning && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="flex-1 leading-snug">{toast.text}</span>
          </div>
        );
      })}
    </div>
  );
};
