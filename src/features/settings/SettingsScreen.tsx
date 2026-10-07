import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { serverTimeService } from '../../services/serverTimeService';
import {
  Globe,
  Moon,
  Sun,
  Fingerprint,
  Bell,
  Clock,
  ShieldCheck,
  Smartphone,
  Info,
  ChevronLeft,
  Check,
  RefreshCw,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    smartReminders,
    updateReminders,
    profile,
    setActiveTab,
    showToast,
    liveServerTime,
  } = useAppStore();

  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncServerClock = async () => {
    setIsSyncing(true);
    await serverTimeService.syncWithServer();
    setIsSyncing(false);
    showToast('Authoritative IST network clock synchronized.', 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-extrabold text-white">App Settings</h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
          v3.0.0
        </span>
      </div>

      {/* 1. Language Preferences (English, ગુજરાતી, हिन्दी) */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Language / ભાષા / भाषा
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'en', label: 'English', sub: 'Default' },
            { id: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
            { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                setLanguage(lang.id as any);
                showToast(`Language switched to ${lang.label}`, 'info');
              }}
              className={`p-3 rounded-xl border text-center transition-all ${
                language === lang.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-[#18233e] border-[#243456] text-slate-300 hover:text-white'
              }`}
            >
              <span className="font-bold text-xs block">{lang.label}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{lang.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Theme & Biometrics */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3.5 shadow-md text-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Appearance & Security
        </h3>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-200">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <div>
              <span className="font-semibold block">Interface Theme</span>
              <span className="text-[10px] text-slate-400">
                {theme === 'dark' ? 'Dark Mode (High Contrast #0a0f1d)' : 'Light Mode'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-[#18233e] hover:bg-[#243456] border border-[#243456] text-slate-200 font-semibold"
          >
            {theme === 'dark' ? 'Switch Light' : 'Switch Dark'}
          </button>
        </div>

        {/* Biometric Lock Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-200">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold block">Biometric Lock</span>
              <span className="text-[10px] text-slate-400">
                Require Face ID / Fingerprint to open payslips & approvals
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={biometricEnabled}
            onChange={(e) => setBiometricEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 bg-[#18233e] border-[#243456]"
          />
        </div>

        {/* Authoritative Server Clock Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="font-semibold block">IST Server Time Sync</span>
              <span className="text-[10px] font-mono text-emerald-400">
                {liveServerTime.time} IST (Tamper-Proof)
              </span>
            </div>
          </div>
          <button
            onClick={handleSyncServerClock}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-[#18233e] hover:bg-[#243456] text-slate-300"
            title="Re-sync Server Time"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Smart Reminders (MVP+ Feature) */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3.5 shadow-md text-xs">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Smart Attendance Reminders (MVP+)
          </h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
            <div>
              <span className="font-semibold text-white block">
                Office Geofence Arrival Reminder
              </span>
              <span className="text-[11px] text-slate-400">
                Notifies "Punch In?" when entering Surat HQ geofence on working days
              </span>
            </div>
            <input
              type="checkbox"
              checked={smartReminders.remindPunchInAtOffice}
              onChange={(e) =>
                updateReminders({ remindPunchInAtOffice: e.target.checked })
              }
              className="mt-1 w-4 h-4 rounded text-blue-600 bg-[#18233e] border-[#243456]"
            />
          </label>

          <label className="flex items-start justify-between gap-3 cursor-pointer select-none pt-2 border-t border-[#243456]/50">
            <div>
              <span className="font-semibold text-white block">
                Shift End Check-Out Reminder
              </span>
              <span className="text-[11px] text-slate-400">
                Reminds you at 06:30 PM if you are still checked in
              </span>
            </div>
            <input
              type="checkbox"
              checked={smartReminders.remindPunchOutAtShiftEnd}
              onChange={(e) =>
                updateReminders({ remindPunchOutAtShiftEnd: e.target.checked })
              }
              className="mt-1 w-4 h-4 rounded text-blue-600 bg-[#18233e] border-[#243456]"
            />
          </label>

          <label className="flex items-start justify-between gap-3 cursor-pointer select-none pt-2 border-t border-[#243456]/50">
            <div>
              <span className="font-semibold text-white block">
                Pending Timesheet Reminder
              </span>
              <span className="text-[11px] text-slate-400">
                Daily alert at 06:30 PM if logged hours are less than 8 hours
              </span>
            </div>
            <input
              type="checkbox"
              checked={smartReminders.remindPendingTimesheet}
              onChange={(e) =>
                updateReminders({ remindPendingTimesheet: e.target.checked })
              }
              className="mt-1 w-4 h-4 rounded text-blue-600 bg-[#18233e] border-[#243456]"
            />
          </label>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-[#18233e]/50 border border-[#243456] rounded-2xl p-4 text-center space-y-1 text-xs">
        <h4 className="font-bold text-white">LogiHR Mobile ESS</h4>
        <p className="text-[11px] text-slate-400">
          Crafted for LogiBrisk Technologies (Surat · Ahmedabad · Mumbai)
        </p>
        <span className="text-[10px] font-mono text-slate-500 block pt-1">
          Compliant with Indian Digital Personal Data Protection (DPDP) Act
        </span>
      </div>
    </div>
  );
};
