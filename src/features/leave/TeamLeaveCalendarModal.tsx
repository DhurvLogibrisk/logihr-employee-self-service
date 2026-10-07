import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Users, Calendar, CheckCircle2 } from 'lucide-react';

export const TeamLeaveCalendarModal: React.FC = () => {
  const { closeModal } = useAppStore();

  const teamLeaves = [
    { name: 'Neha Joshi', role: 'Lead QA Engineer', type: 'Sick Leave', dates: '07 Oct - 08 Oct 2026', status: 'Approved' },
    { name: 'Ananya Sharma', role: 'Senior Frontend Dev', type: 'Casual Leave', dates: '09 Oct 2026', status: 'Pending Approval' },
    { name: 'Harsh Vardhan', role: 'DevOps Lead', type: 'Work From Home', dates: '08 Oct 2026', status: 'Approved' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#243456] flex items-center justify-between bg-[#18233e]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Team Leave Calendar
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <p className="text-xs text-slate-400">
            Current leave status for Product & Engineering team members this week:
          </p>

          <div className="space-y-2.5">
            {teamLeaves.map((tl, i) => (
              <div
                key={i}
                className="bg-[#18233e] border border-[#243456] rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{tl.name}</h4>
                  <span className="text-[11px] text-slate-400">{tl.role}</span>
                  <div className="text-[11px] font-mono text-cyan-300 mt-1">
                    {tl.dates} ({tl.type})
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tl.status === 'Approved'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {tl.status}
                </span>
              </div>
            ))}
          </div>
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
