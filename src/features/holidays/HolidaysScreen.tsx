import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { Calendar, X, Sparkles } from 'lucide-react';

export const HolidaysScreen: React.FC = () => {
  const { closeModal } = useAppStore();
  const holidays = apiService.getHolidays();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#243456] flex items-center justify-between bg-[#18233e]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              2026 Holiday Calendar
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 overflow-y-auto">
          {holidays.map((h) => (
            <div
              key={h.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                h.isUpcoming
                  ? 'bg-amber-950/40 border-amber-600/50 text-white'
                  : 'bg-[#18233e] border-[#243456] text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-white">{h.name}</h4>
                  {h.isUpcoming && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                      Upcoming
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  {h.date} ({h.dayOfWeek})
                </span>
              </div>

              <span className="text-[10px] text-slate-400 bg-[#121a2f] px-2 py-1 rounded-lg border border-[#243456]">
                {h.type}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#243456] bg-[#18233e]">
          <button
            onClick={closeModal}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
