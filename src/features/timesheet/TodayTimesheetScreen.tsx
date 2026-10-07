import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import {
  FileSpreadsheet,
  Plus,
  Send,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const TodayTimesheetScreen: React.FC = () => {
  const {
    todayTimesheetRows,
    todayPunches,
    openModal,
    refreshData,
    showToast,
    setActiveTab,
  } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total Hours calculation
  const totalMinutes = todayTimesheetRows.reduce((acc, row) => {
    const [h, m] = row.hours.split(':').map(Number);
    return acc + (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m);
  }, 0);
  const totalHrs = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const totalHoursFormatted = `${String(totalHrs).padStart(2, '0')}:${String(totalMins).padStart(2, '0')}`;

  const targetMinutes = 480; // 8 hours
  const progressPercent = Math.min(100, Math.round((totalMinutes / targetMinutes) * 100));

  // Smart gap detector
  // E.g. Check if rows have a gap between 13:00 and 14:00 (Lunch / Untracked)
  const hasUnfilledGap = totalMinutes > 0 && totalMinutes < 420;

  const handleSubmitForApproval = async () => {
    if (todayTimesheetRows.length === 0) {
      showToast('Cannot submit empty timesheet. Please add at least one row.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.submitTodayTimesheet();
      refreshData();
      showToast(`Today's timesheet submitted for manager approval (${res.totalHours} hrs).`, 'success');
    } catch {
      showToast('Failed to submit timesheet.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Header Summary Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Timesheet For Today
            </span>
            <h2 className="text-base font-extrabold text-white">
              07 Oct 2026 (Wednesday)
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('timesheet-monthly')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Monthly Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar & Hours */}
        <div className="bg-[#18233e] rounded-xl p-3 border border-[#243456]/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Logged Time:</span>
            <span className="font-mono font-black text-cyan-300 text-sm">
              {totalHoursFormatted} / 08:00 Hours
            </span>
          </div>

          <div className="w-full bg-[#121a2f] h-2.5 rounded-full overflow-hidden border border-[#243456]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Progress: {progressPercent}% of workday</span>
            <span className="text-emerald-400 font-semibold">
              {progressPercent >= 100 ? 'Target Achieved' : `${Math.max(0, 480 - totalMinutes)} mins remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Smart Gap Detector */}
      {hasUnfilledGap && (
        <div className="bg-blue-950/60 border border-blue-600/50 rounded-xl p-3 flex items-start justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Smart Gap Detected:</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                You logged {totalHoursFormatted} out of your 8-hour target. Fill remaining afternoon tasks?
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal('add-timesheet')}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shrink-0"
          >
            Fill Gap
          </button>
        </div>
      )}

      {/* 3. Timeline Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Today's Activity Timeline ({todayTimesheetRows.length})
          </h3>
          <button
            onClick={() => openModal('add-timesheet')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            + Add Task
          </button>
        </div>

        {todayTimesheetRows.length === 0 ? (
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-8 text-center space-y-3">
            <Clock className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">
              No timesheet details logged for today yet.
            </p>
            <button
              onClick={() => openModal('add-timesheet')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Detail Time
            </button>
          </div>
        ) : (
          todayTimesheetRows.map((row, index) => (
            <div
              key={row.id}
              className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-2.5 shadow-sm relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                      {row.taskNo}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {row.modualTaskActivity}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {row.startTime} - {row.endTime}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      ({row.hours} hrs)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openModal('add-timesheet')}
                  className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-400 hover:text-white transition-colors"
                  title="Edit row"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-[#18233e] rounded-xl p-2.5 text-xs text-slate-300 border border-[#243456]/40 leading-relaxed">
                {row.description}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Action Buttons */}
      {todayTimesheetRows.length > 0 && (
        <div className="pt-2">
          <button
            onClick={handleSubmitForApproval}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Timesheet for Manager Approval'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
