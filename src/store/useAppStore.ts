import { useState, useEffect, useCallback } from 'react';
import {
  EmployeeProfile,
  UserRole,
  LanguageCode,
  AttendancePunch,
  LeaveBalance,
  LeaveRequest,
  TimesheetRow,
  ApprovalItem,
  NotificationItem,
  SmartReminderPreferences,
} from '../types';
import { apiService } from '../services/apiService';
import { serverTimeService } from '../services/serverTimeService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}

// Global store pattern for fast reactive state without heavy redux boilerplate
let globalState = {
  profile: apiService.getProfile(),
  activeTab: 'home',
  activePhase2Module: null as string | null,
  language: 'en' as LanguageCode,
  theme: 'dark' as 'dark' | 'light',
  activeModal: null as string | null,
  modalPayload: null as any,
  isOffline: !navigator.onLine,
  clockDriftAlert: serverTimeService.isClockDriftActive(),
  todayPunches: apiService.getTodayPunches(),
  leaveBalances: apiService.getLeaveBalances(),
  leaveRequests: apiService.getLeaveRequests(),
  todayTimesheetRows: apiService.getTodayTimesheetRows(),
  approvals: apiService.getApprovals(),
  notifications: apiService.getNotifications(),
  smartReminders: {
    remindPunchInAtOffice: true,
    remindPunchOutAtShiftEnd: true,
    remindPendingTimesheet: true,
    timesheetReminderTime: '18:30',
    quietHoursStart: '21:00',
    quietHoursEnd: '08:00',
  } as SmartReminderPreferences,
  liveServerTime: serverTimeService.getLiveTimeDisplayIST(),
  toasts: [] as ToastMessage[],
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useAppStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      globalState.liveServerTime = serverTimeService.getLiveTimeDisplayIST();
      globalState.clockDriftAlert = serverTimeService.isClockDriftActive();
      notify();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      globalState.isOffline = false;
      notify();
    };
    const handleOffline = () => {
      globalState.isOffline = true;
      notify();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, text, type };
    globalState.toasts = [...globalState.toasts, newToast];
    notify();
    setTimeout(() => {
      globalState.toasts = globalState.toasts.filter((t) => t.id !== id);
      notify();
    }, 3500);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    globalState.activeTab = tab;
    notify();
  }, []);

  const setActivePhase2Module = useCallback((mod: string | null) => {
    globalState.activePhase2Module = mod;
    notify();
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    globalState.language = lang;
    notify();
  }, []);

  const toggleTheme = useCallback(() => {
    globalState.theme = globalState.theme === 'dark' ? 'light' : 'dark';
    if (globalState.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    notify();
  }, []);

  const openModal = useCallback((modalName: string, payload?: any) => {
    globalState.activeModal = modalName;
    globalState.modalPayload = payload || null;
    notify();
  }, []);

  const closeModal = useCallback(() => {
    globalState.activeModal = null;
    globalState.modalPayload = null;
    notify();
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    apiService.updateRole(role);
    globalState.profile = apiService.getProfile();
    notify();
  }, []);

  const refreshData = useCallback(() => {
    globalState.todayPunches = apiService.getTodayPunches();
    globalState.leaveBalances = apiService.getLeaveBalances();
    globalState.leaveRequests = apiService.getLeaveRequests();
    globalState.todayTimesheetRows = apiService.getTodayTimesheetRows();
    globalState.approvals = apiService.getApprovals();
    globalState.notifications = apiService.getNotifications();
    notify();
  }, []);

  const updateReminders = useCallback((prefs: Partial<SmartReminderPreferences>) => {
    globalState.smartReminders = { ...globalState.smartReminders, ...prefs };
    notify();
  }, []);

  return {
    ...globalState,
    setActiveTab,
    setActivePhase2Module,
    setLanguage,
    toggleTheme,
    openModal,
    closeModal,
    switchRole,
    refreshData,
    showToast,
    updateReminders,
  };
}
