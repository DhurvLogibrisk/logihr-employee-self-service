import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n/translations';
import {
  Bell,
  ShieldCheck,
  Moon,
  Sun,
  Globe,
  UserCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    profile,
    language,
    setLanguage,
    theme,
    toggleTheme,
    notifications,
    openModal,
    switchRole,
    liveServerTime,
    clockDriftAlert,
    setActiveTab,
  } = useAppStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-[#243456]/70 px-4 py-3 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand & Live IST Clock */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-white text-base tracking-tighter">
            L
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">LogiHR</span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                IST
              </span>
            </div>
            {/* Authoritative Server Clock */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${clockDriftAlert ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="font-semibold text-emerald-300">{liveServerTime.time}</span>
              <span className="text-slate-500 text-[10px] hidden sm:inline">({liveServerTime.date})</span>
            </div>
          </div>
        </div>

        {/* Right Controls: Role Switcher, Language, Theme, Bell */}
        <div className="flex items-center gap-1.5">
          {/* Quick Role Switcher Pill (Emp / Mgr / HR) */}
          <div className="flex items-center bg-[#121a2f] border border-[#243456] rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => switchRole('EMPLOYEE')}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                profile.role === 'EMPLOYEE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Employee Mode"
            >
              Emp
            </button>
            <button
              onClick={() => switchRole('MANAGER')}
              className={`px-2 py-0.5 rounded font-medium transition-all ${
                profile.role === 'MANAGER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Manager Mode"
            >
              Mgr
            </button>
          </div>

          {/* Language Toggle Button */}
          <button
            onClick={() => {
              const nextLang = language === 'en' ? 'gu' : language === 'gu' ? 'hi' : 'en';
              setLanguage(nextLang);
            }}
            className="w-8 h-8 rounded-lg bg-[#121a2f] border border-[#243456] flex items-center justify-center text-xs font-semibold text-slate-300 hover:bg-[#18233e] transition-colors"
            title="Switch Language (English / ગુજરાતી / हिन्दी)"
          >
            {language === 'en' ? 'EN' : language === 'gu' ? 'ગુ' : 'हि'}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => openModal('notifications')}
            className="relative w-8 h-8 rounded-lg bg-[#121a2f] border border-[#243456] flex items-center justify-center text-slate-300 hover:bg-[#18233e] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#0a0f1d] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
