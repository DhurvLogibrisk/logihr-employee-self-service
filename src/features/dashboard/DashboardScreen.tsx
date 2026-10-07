import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import {
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  CheckSquare,
  Sparkles,
  MapPin,
  Calendar,
  ChevronRight,
  Gift,
  Users,
  Megaphone,
  Briefcase,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    profile,
    todayPunches,
    leaveBalances,
    todayTimesheetRows,
    approvals,
    openModal,
    setActiveTab,
    liveServerTime,
    showToast,
  } = useAppStore();

  const isManager = profile.role === 'MANAGER' || profile.role === 'HR_ADMIN';
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  const holidays = apiService.getHolidays();
  const nextHoliday = holidays.find((h) => h.isUpcoming) || holidays[0];

  // Determine attendance status
  const lastPunch = todayPunches[todayPunches.length - 1];
  const firstIn = todayPunches.find((p) => p.type === 'IN');
  const isCheckedIn = lastPunch?.type === 'IN' || lastPunch?.type === 'BREAK_OUT';
  const isCheckedOut = lastPunch?.type === 'OUT';

  // Timesheet hours calculation
  const totalTimesheetMinutes = todayTimesheetRows.reduce((acc, row) => {
    const [h, m] = row.hours.split(':').map(Number);
    return acc + (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m);
  }, 0);
  const tsHours = Math.floor(totalTimesheetMinutes / 60);
  const tsMins = totalTimesheetMinutes % 60;
  const timesheetFormatted = `${String(tsHours).padStart(2, '0')}:${String(tsMins).padStart(2, '0')}`;

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Birthday celebration confetti trigger
  const handleTriggerConfetti = () => {
    showToast('🎉 Happy Birthday Ritesh Patel! LogiBrisk family wishes you success!', 'info');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Greeting Banner & Avatar */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">
            {getGreeting()}
          </span>
          <h1 className="text-lg font-extrabold text-white tracking-tight">
            {profile.name}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {profile.designation} · {profile.workLocation}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('profile')}
          className="relative group p-0.5 rounded-full border-2 border-blue-500/60 hover:border-blue-400 transition-all"
        >
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-12 h-12 rounded-full object-cover shadow-md"
          />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#121a2f]" />
        </button>
      </div>

      {/* 2. Today's Attendance Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Today's Attendance
            </h2>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isCheckedIn
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : isCheckedOut
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isCheckedIn ? 'Checked In' : isCheckedOut ? 'Checked Out' : 'Not Punched'}
          </span>
        </div>

        <div className="bg-[#18233e] rounded-xl p-3 border border-[#243456]/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">First Punch In:</span>
            <span className="text-sm font-mono font-bold text-white mt-0.5 block">
              {firstIn ? `${firstIn.serverTimeFormattedIST} IST` : '--:--'}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {firstIn ? firstIn.siteName : 'Surat HQ Geofence'}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('attendance')}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-md shadow-blue-600/30"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Today's Work Summary (Timesheet) Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Today's Work Summary
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold text-cyan-400">
            {todayTimesheetRows.length} Row{todayTimesheetRows.length > 1 ? 's' : ''} Logged
          </span>
        </div>

        <div className="bg-[#18233e] rounded-xl p-3 border border-[#243456]/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Logged Hours vs Target (08:00):</span>
            <span className="font-mono font-black text-white">{timesheetFormatted} / 08:00 hrs</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#121a2f] h-2 rounded-full overflow-hidden border border-[#243456]">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalTimesheetMinutes / 480) * 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => openModal('add-timesheet')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              + Add Detail Time
            </button>
            <button
              onClick={() => setActiveTab('timesheet')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Timeline &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              Attendance
            </span>
          </button>

          <button
            onClick={() => openModal('add-leave')}
            className="bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-700/60 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              Add Leave
            </span>
          </button>

          <button
            onClick={() => openModal('add-timesheet')}
            className="bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">
              Time Sheet
            </span>
          </button>

          {isManager ? (
            <button
              onClick={() => setActiveTab('approvals')}
              className="bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-sm relative"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 leading-tight">
                Approvals
              </span>
              {pendingApprovalsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => openModal('holidays')}
              className="bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200 leading-tight">
                Holidays
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Leave Balances Mini-Cards */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Leave Balances
          </h3>
          <button
            onClick={() => setActiveTab('leave')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            My Leaves &rarr;
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {leaveBalances.slice(0, 4).map((lb) => (
            <div
              key={lb.code}
              className="bg-[#121a2f] border border-[#243456] rounded-xl p-2.5 text-center shadow-sm"
            >
              <span className="text-[10px] font-bold text-slate-400 block truncate">
                {lb.shortCode}
              </span>
              <span className="text-lg font-black font-mono text-cyan-300 mt-0.5 block">
                {lb.balance}
              </span>
              <span className="text-[9px] text-slate-500 font-medium block">
                of {lb.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Upcoming Holiday Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 to-[#18233e] border border-amber-700/40 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              Upcoming Holiday
            </span>
            <h4 className="text-xs font-bold text-white mt-0.5">
              {nextHoliday.name}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {nextHoliday.date} ({nextHoliday.dayOfWeek}) · {nextHoliday.type}
            </p>
          </div>
        </div>

        <button
          onClick={() => openModal('holidays')}
          className="px-2.5 py-1.5 rounded-lg bg-[#243456] hover:bg-[#2d426d] text-slate-200 text-xs font-semibold transition-colors"
        >
          Calendar
        </button>
      </div>

      {/* 7. Birthday & Work Anniversary Carousel + Team on Leave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Birthday card */}
        <div
          onClick={handleTriggerConfetti}
          className="bg-[#121a2f] border border-[#243456] hover:border-pink-500/60 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-700/60 text-pink-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-pink-400">
                Birthday Today
              </span>
              <p className="text-xs font-bold text-white">Ritesh Patel</p>
              <p className="text-[10px] text-slate-400">Fullstack Engineer · Tap for cheer</p>
            </div>
          </div>
          <span className="text-xs">🎉</span>
        </div>

        {/* Team on Leave Today */}
        <div
          onClick={() => openModal('team-calendar')}
          className="bg-[#121a2f] border border-[#243456] hover:border-blue-500/60 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-700/60 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400">
                Team On Leave
              </span>
              <p className="text-xs font-bold text-white">Neha Joshi (QA)</p>
              <p className="text-[10px] text-slate-400">Back tomorrow · View roster</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 8. Phase 2 Modules Launcher Carousel */}
      <div className="bg-[#18233e]/50 border border-[#243456] rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            More Services & Self-Service
          </span>
          <span className="text-[10px] text-cyan-400 font-semibold">Phase 2 Modules</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
          <button
            onClick={() => setActiveTab('phase2-expenses')}
            className="p-2 rounded-xl bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] text-slate-300 font-semibold"
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('phase2-hrletters')}
            className="p-2 rounded-xl bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] text-slate-300 font-semibold"
          >
            HR Letters
          </button>
          <button
            onClick={() => setActiveTab('phase2-tax')}
            className="p-2 rounded-xl bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] text-slate-300 font-semibold"
          >
            Tax & PF
          </button>
          <button
            onClick={() => setActiveTab('phase2-directory')}
            className="p-2 rounded-xl bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] text-slate-300 font-semibold"
          >
            Org Chart
          </button>
        </div>
      </div>

      {/* Floating AI Assistant Trigger */}
      <button
        onClick={() => openModal('ai-assistant')}
        className="fixed bottom-20 right-4 z-30 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-2xl shadow-blue-500/40 flex items-center gap-2 font-bold text-xs transition-transform active:scale-95 border border-white/20"
        aria-label="Open LogiHR AI Assistant"
      >
        <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
        <span className="hidden sm:inline">Ask LogiHR AI</span>
      </button>
    </div>
  );
};
