import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { AttendanceDay } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  List,
} from 'lucide-react';

export const AttendanceHistoryScreen: React.FC = () => {
  const { showToast } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [filter, setFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'HEATMAP'>('LIST');
  const [selectedDayDetail, setSelectedDayDetail] = useState<AttendanceDay | null>(null);

  const history = apiService.getAttendanceHistory(selectedMonth);

  const presentDays = history.filter((d) => d.status === 'PRESENT');
  const presentCount = presentDays.length;
  const lateCount = history.filter((d) => d.isLate).length;
  const totalMinutes = presentDays.reduce((acc, d) => acc + (d.totalWorkMinutes || 0), 0);
  const avgMins = presentCount > 0 ? Math.round(totalMinutes / presentCount) : 0;
  const avgHoursStr = `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`;
  const attendanceRate = history.length > 0 ? Math.round((presentCount / (history.filter(d => d.dayType === 'Working day').length || 1)) * 100) : 0;

  const filteredDays = history.filter((d) => {
    if (filter === 'ALL') return true;
    if (filter === 'PRESENT') return d.status === 'PRESENT';
    if (filter === 'ABSENT') return d.status === 'ABSENT';
    if (filter === 'LEAVE') return d.status === 'LEAVE';
    if (filter === 'HOLIDAY') return d.status === 'HOLIDAY';
    if (filter === 'LATE') return d.isLate;
    return true;
  });

  const handleExportPDF = () => {
    showToast(`Exported Attendance Report (${selectedMonth}) as PDF.`, 'success');
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

        <div className="flex items-center gap-2">
          {/* View toggle (List vs Heatmap) */}
          <button
            onClick={() => setViewMode(viewMode === 'LIST' ? 'HEATMAP' : 'LIST')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Toggle Calendar Heatmap"
          >
            {viewMode === 'LIST' ? <CalendarDays className="w-4 h-4 text-cyan-400" /> : <List className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
            title="Export Month PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Present
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
            {presentCount}
          </span>
          <span className="text-[9px] text-slate-500 font-medium">{attendanceRate}% rate</span>
        </div>

        <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Late Marks
          </span>
          <span className="text-xl font-black text-amber-400 font-mono mt-0.5 block">
            {lateCount}
          </span>
          <span className="text-[9px] text-amber-400/80 font-medium">&gt; 09:30 AM shift</span>
        </div>

        <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Avg Hours
          </span>
          <span className="text-xl font-black text-cyan-400 font-mono mt-0.5 block">
            {avgHoursStr}
          </span>
          <span className="text-[9px] text-emerald-400 font-medium">9h shift standard</span>
        </div>
      </div>

      {/* Interactive Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'All Days' },
          { id: 'PRESENT', label: 'Present' },
          { id: 'LATE', label: 'Late Mark' },
          { id: 'LEAVE', label: 'Leave' },
          { id: 'HOLIDAY', label: 'Holiday' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === btn.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#121a2f] text-slate-400 hover:text-slate-200 border border-[#243456]'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* List View */}
      {viewMode === 'LIST' ? (
        <div className="space-y-2.5">
          {filteredDays.map((day) => {
            const isPresent = day.status === 'PRESENT';
            const isHoliday = day.status === 'HOLIDAY';
            const isOff = day.status === 'WEEKLY_OFF';

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayDetail(day)}
                className="bg-[#121a2f] border border-[#243456] hover:border-slate-500 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#18233e] border border-[#243456] flex flex-col items-center justify-center font-mono">
                    <span className="text-xs font-bold text-white leading-none">
                      {day.date.split('-')[2]}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase leading-none mt-0.5">
                      {day.dayOfWeek.slice(0, 3)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {day.dayType}
                      </span>
                      {day.isLate && (
                        <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-800">
                          Late
                        </span>
                      )}
                      {(day.regularizationStatus === 'APPROVED' || day.inTime?.includes('Regularized')) && (
                        <span className="text-[9px] bg-teal-950 text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-700">
                          Regularized
                        </span>
                      )}
                    </div>
                    {isPresent ? (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        In: <span className="text-emerald-400 font-semibold">{day.inTime}</span> · Out: <span className="text-cyan-400 font-semibold">{day.outTime}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isHoliday ? 'Gazetted Public Holiday' : isOff ? 'Official Weekend Off' : 'No Punch Recorded'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {isPresent ? (
                    <>
                      <span className="text-xs font-black font-mono text-cyan-300 block">
                        {Math.floor(day.totalWorkMinutes / 60)}h {day.totalWorkMinutes % 60}m
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Break: {day.breakMinutes}m
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">--</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Heatmap Mode */
        <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
            <span>October 2026 Calendar Grid</span>
            <span className="text-[10px] text-emerald-400 font-normal">Green = Present</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-[10px] font-bold text-slate-500 py-1">
                {d}
              </div>
            ))}
            {/* Generate calendar cells */}
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const isPast = dayNum <= 7;
              const isWeekend = (dayNum + 3) % 7 === 5 || (dayNum + 3) % 7 === 6;
              return (
                <div
                  key={dayNum}
                  className={`p-2 rounded-lg font-mono text-[11px] font-semibold flex items-center justify-center transition-all ${
                    dayNum === 2
                      ? 'bg-purple-900/40 text-purple-300 border border-purple-700'
                      : isWeekend
                      ? 'bg-[#18233e]/40 text-slate-600'
                      : isPast
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                      : 'bg-[#18233e] text-slate-400'
                  }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Detail Sheet Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#243456] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedDayDetail.date} ({selectedDayDetail.dayOfWeek})
                </h3>
                <span className="text-xs text-slate-400">{selectedDayDetail.dayType}</span>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1 rounded-lg hover:bg-[#243456] text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between bg-[#18233e] p-2.5 rounded-xl">
                <span className="text-slate-400">First Check In:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedDayDetail.inTime || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between bg-[#18233e] p-2.5 rounded-xl">
                <span className="text-slate-400">Final Check Out:</span>
                <span className="font-mono font-bold text-cyan-400">{selectedDayDetail.outTime || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between bg-[#18233e] p-2.5 rounded-xl">
                <span className="text-slate-400">Total Work Duration:</span>
                <span className="font-mono font-bold text-white">
                  {Math.floor(selectedDayDetail.totalWorkMinutes / 60)}h {selectedDayDetail.totalWorkMinutes % 60}m
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#18233e] p-2.5 rounded-xl">
                <span className="text-slate-400">Geofence Location:</span>
                <span className="text-slate-200 font-medium">LogiBrisk HQ (Surat)</span>
              </div>
              <div className="flex items-center justify-between bg-[#18233e] p-2.5 rounded-xl">
                <span className="text-slate-400">Tamper Status:</span>
                <span className="text-emerald-400 font-semibold">Authoritative IST Verified</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDayDetail(null)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
