import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { serverTimeService } from '../services/serverTimeService';

export const OfflineBanner: React.FC = () => {
  const { isOffline, clockDriftAlert } = useAppStore();

  if (!isOffline && !clockDriftAlert) return null;

  return (
    <div className="max-w-md mx-auto px-3 pt-2">
      {isOffline && (
        <div className="bg-amber-950/80 border border-amber-600/60 rounded-xl p-2.5 text-xs text-amber-200 flex items-start gap-2 shadow-lg mb-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Offline Mode Active</p>
            <p className="text-[11px] text-amber-200/90 mt-0.5">
              Attendance punches will be safely queued locally and tagged as 'offline synced' with authoritative server time upon reconnection.
            </p>
          </div>
        </div>
      )}

      {clockDriftAlert && (
        <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-2.5 text-xs text-rose-200 flex items-start gap-2 shadow-lg mb-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Clock Drift Detected (&gt;2 min)</p>
            <p className="text-[11px] text-rose-200/90 mt-0.5">
              Your device time diverges from the authoritative IST network clock. LogiHR strictly enforces server-stamped IST timestamps for all attendance records.
            </p>
          </div>
          <button
            onClick={() => serverTimeService.syncWithServer()}
            className="p-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[10px] font-medium"
            title="Re-sync Server Clock"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
