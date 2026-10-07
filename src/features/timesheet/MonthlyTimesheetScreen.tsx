import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';

export const MonthlyTimesheetScreen: React.FC = () => {
  const { showToast, setActiveTab, openModal } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  // Read monthly timesheets from database/service store
  const timesheetsMap = apiService.getMonthlyTimesheets();
  const holidays = apiService.getHolidays();

  // Build the days list for October 2026
  const year = 2026;
  const month = 10;
  const daysInMonth = 31;

  const logs = [];
  let loggedDaysCount = 0;
  let totalLoggedMinutes = 0;
  let workingDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const isHoliday = holidays.some((h) => h.date === dateStr);

    if (!isWeekend && !isHoliday) {
      workingDaysCount++;
    }

    const ts = timesheetsMap[dateStr];
    if (ts) {
      loggedDaysCount++;
      totalLoggedMinutes += ts.totalMinutes || 0;
      logs.push({
        date: dateStr,
        dayOfWeek,
        hours: ts.totalHours,
        totalMinutes: ts.totalMinutes,
        tasks: ts.rows?.length || 0,
        status: ts.status,
      });
    } else if (isHoliday) {
      logs.push({
        date: dateStr,
        dayOfWeek,
        hours: '00:00',
        totalMinutes: 0,
        tasks: 0,
        status: 'HOLIDAY',
      });
    } else if (isWeekend) {
      logs.push({
        date: dateStr,
        dayOfWeek,
        hours: '00:00',
        totalMinutes: 0,
        tasks: 0,
        status: 'WEEKLY_OFF',
      });
    } else {
      logs.push({
        date: dateStr,
        dayOfWeek,
        hours: '00:00',
        totalMinutes: 0,
        tasks: 0,
        status: d <= 7 ? 'PENDING' : 'UPCOMING',
      });
    }
  }

  // Calculate totals
  const totalHrs = Math.floor(totalLoggedMinutes / 60);
  const totalMins = totalLoggedMinutes % 60;
  const totalHoursFormatted = `${String(totalHrs).padStart(2, '0')}:${String(totalMins).padStart(2, '0')}`;
  const avgMins = loggedDaysCount > 0 ? Math.round(totalLoggedMinutes / loggedDaysCount) : 0;
  const avgHrs = Math.floor(avgMins / 60);
  const avgRemMins = avgMins % 60;
  const avgFormatted = `${String(avgHrs).padStart(2, '0')}:${String(avgRemMins).padStart(2, '0')}`;

  const handleExport = (format: 'PDF' | 'EXCEL') => {
    showToast(`Timesheet report exported as ${format} (${selectedMonth}).`, 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Month Selector & Controls */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedMonth('September 2026')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">{selectedMonth}</span>
          </div>
          <button
            onClick={() => setSelectedMonth('October 2026')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleExport('EXCEL')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExport('PDF')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Work Days
          </span>
          <span className="text-xl font-black text-white font-mono mt-0.5 block">
            {workingDaysCount}
          </span>
          <span className="text-[9px] text-slate-500 font-medium">Logged: {loggedDaysCount}</span>
        </div>

        <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Hours
          </span>
          <span className="text-xl font-black text-cyan-300 font-mono mt-0.5 block">
            {totalHoursFormatted}
          </span>
          <span className="text-[9px] text-emerald-400 font-medium">Target: {workingDaysCount * 8}h</span>
        </div>

        <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Avg / Day
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
            {avgFormatted}
          </span>
          <span className="text-[9px] text-slate-500 font-medium">8h standard</span>
        </div>
      </div>

      {/* Day Rows */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {selectedMonth} Database Records
          </h3>
          <button
            onClick={() => setActiveTab('timesheet')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today&apos;s Timesheet</span>
          </button>
        </div>

        {logs.slice(0, 15).map((log) => {
          const isOff = log.status === 'WEEKLY_OFF';
          const isHoliday = log.status === 'HOLIDAY';
          const isApproved = log.status === 'APPROVED';
          const isSubmitted = log.status === 'SUBMITTED';
          const isDraft = log.status === 'DRAFT';

          return (
            <div
              key={log.date}
              onClick={() => {
                if (!isOff && !isHoliday) {
                  openModal('add-timesheet');
                }
              }}
              className={`bg-[#121a2f] border border-[#243456] rounded-xl p-3.5 flex items-center justify-between shadow-sm transition-colors ${
                !isOff && !isHoliday ? 'cursor-pointer hover:border-blue-500/50 hover:bg-[#18233e]/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#18233e] border border-[#243456] flex flex-col items-center justify-center font-mono">
                  <span className="text-xs font-bold text-white leading-none">
                    {log.date.split('-')[2]}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase leading-none mt-0.5">
                    {log.dayOfWeek.slice(0, 3)}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-white block">
                    {isOff
                      ? 'Weekly Off'
                      : isHoliday
                      ? 'Gazetted Holiday'
                      : log.tasks > 0
                      ? `${log.tasks} Tasks Logged`
                      : 'No Tasks Logged'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {log.hours !== '00:00' ? `${log.hours} Hours Logged` : 'Non-working day'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isApproved
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                      : isSubmitted
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
                      : isDraft
                      ? 'bg-purple-950 text-purple-300 border-purple-700/60'
                      : isOff || isHoliday
                      ? 'bg-[#18233e] text-slate-400 border-[#243456]'
                      : 'bg-amber-950 text-amber-300 border-amber-700/60'
                  }`}
                >
                  {isApproved
                    ? 'Approved'
                    : isSubmitted
                    ? 'Submitted'
                    : isDraft
                    ? 'Draft'
                    : isOff
                    ? 'Off'
                    : isHoliday
                    ? 'Holiday'
                    : log.status}
                </span>
                {!isOff && !isHoliday && (
                  <Plus className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
