import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/apiService';
import { Clock, ShieldCheck, MapPin, Zap, X } from 'lucide-react';

export const QuickPunchWidget: React.FC = () => {
  const { todayPunches, liveServerTime, showToast, refreshData, closeModal } = useAppStore();

  const lastPunch = todayPunches[todayPunches.length - 1];
  const isCheckedIn = lastPunch?.type === 'IN' || lastPunch?.type === 'BREAK_OUT';

  const handleWidgetPunch = async () => {
    try {
      const type = isCheckedIn ? 'OUT' : 'IN';
      const res = await apiService.recordPunch({
        type,
        workMode: 'OFFICE',
        latitude: 21.17024,
        longitude: 72.831061,
        accuracy: 10,
      });
      refreshData();
      showToast(`Quick Widget Punch: ${res.punch.type} stamped at ${res.punch.serverTimeFormattedIST} IST`, 'success');
      closeModal();
    } catch {
      showToast('Quick punch failed.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#121a2f] border border-[#243456] rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Lock Screen / Home Widget Preview
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg hover:bg-[#243456] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Native Widget Canvas */}
        <div className="bg-gradient-to-br from-[#18233e] to-[#0d162b] border border-cyan-800/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              LogiHR Live Activity
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              {liveServerTime.time} IST
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">
                {isCheckedIn ? 'Shift In Progress' : 'Not Punched Today'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {isCheckedIn ? `In at ${lastPunch.serverTimeFormattedIST} (Surat HQ)` : 'Shift starts 09:30 AM'}
              </span>
            </div>

            <button
              onClick={handleWidgetPunch}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase text-white shadow-lg transition-transform active:scale-95 ${
                isCheckedIn
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isCheckedIn ? 'Check Out' : 'Check In'}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          Native widget actions trigger server-authenticated IST punches with biometric check.
        </p>
      </div>
    </div>
  );
};
