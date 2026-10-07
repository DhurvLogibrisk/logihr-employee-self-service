import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { t } from '../i18n/translations';
import {
  Home,
  Clock,
  FileSpreadsheet,
  CalendarCheck,
  CheckSquare,
  User,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, profile, approvals, language } = useAppStore();

  const isManager = profile.role === 'MANAGER' || profile.role === 'HR_ADMIN';
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  const tabs = [
    {
      id: 'home',
      label: t('nav_home', language),
      icon: Home,
    },
    {
      id: 'attendance',
      label: t('nav_attendance', language),
      icon: Clock,
    },
    {
      id: 'timesheet',
      label: t('nav_timesheet', language),
      icon: FileSpreadsheet,
    },
    {
      id: 'leave',
      label: t('nav_leave', language),
      icon: CalendarCheck,
    },
    ...(isManager
      ? [
          {
            id: 'approvals',
            label: t('nav_approvals', language),
            icon: CheckSquare,
            badge: pendingApprovalsCount,
          },
        ]
      : []),
    {
      id: 'profile',
      label: t('nav_profile', language),
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f1d]/95 backdrop-blur-lg border-t border-[#243456] pb-safe transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] text-blue-400' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-md border border-[#0a0f1d]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
