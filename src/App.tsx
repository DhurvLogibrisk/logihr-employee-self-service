import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { ToastContainer } from './components/ToastContainer';

// Feature Screens
import { LoginScreen } from './features/auth/LoginScreen';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { AttendanceTodayScreen } from './features/attendance/AttendanceTodayScreen';
import { AttendanceHistoryScreen } from './features/attendance/AttendanceHistoryScreen';
import { MyLeaveScreen } from './features/leave/MyLeaveScreen';
import { TodayTimesheetScreen } from './features/timesheet/TodayTimesheetScreen';
import { MonthlyTimesheetScreen } from './features/timesheet/MonthlyTimesheetScreen';
import { ApprovalsScreen } from './features/approvals/ApprovalsScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { KioskModeScreen } from './features/kiosk/KioskModeScreen';
import { Phase2HubScreen } from './features/phase2/Phase2HubScreen';
import { PayslipsScreen } from './features/payslips/PayslipsScreen';
import { AnnouncementsScreen } from './features/announcements/AnnouncementsScreen';
import { HelpdeskScreen } from './features/helpdesk/HelpdeskScreen';

// Modals
import { AddLeaveModal } from './features/leave/AddLeaveModal';
import { AddTimeSheetModal } from './features/timesheet/AddTimeSheetModal';
import { RegularizationModal } from './features/attendance/RegularizationModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { TeamLeaveCalendarModal } from './features/leave/TeamLeaveCalendarModal';
import { NotificationsScreen } from './features/notifications/NotificationsScreen';
import { HolidaysScreen } from './features/holidays/HolidaysScreen';
import { QuickPunchWidget } from './components/QuickPunchWidget';
import { PrivacyConsentModal } from './components/PrivacyConsentModal';

export default function App() {
  const { activeTab, setActiveTab, activeModal, openModal } = useAppStore();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [attendanceSubTab, setAttendanceSubTab] = useState<'today' | 'history'>('today');

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex justify-center selection:bg-blue-600 selection:text-white antialiased">
      {/* Mobile container baseline (360-430px wide, centered on desktop with subtle device border) */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-[#0a0f1d] border-x border-[#243456]/40 relative shadow-2xl">
        {/* Top Header (omitted in Kiosk mode for full-screen camera immersion) */}
        {activeTab !== 'kiosk' && <Header />}

        {/* Offline / Clock drift alert banner */}
        <OfflineBanner />

        {/* Attendance Sub-navigation toggle if inside attendance tab */}
        {activeTab === 'attendance' && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center bg-[#121a2f] border border-[#243456] rounded-xl p-1">
              <button
                onClick={() => setAttendanceSubTab('today')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  attendanceSubTab === 'today'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today's Punch
              </button>
              <button
                onClick={() => setAttendanceSubTab('history')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  attendanceSubTab === 'history'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly History
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-3 overflow-y-auto">
          {activeTab === 'home' && <DashboardScreen />}
          {activeTab === 'attendance' &&
            (attendanceSubTab === 'today' ? (
              <AttendanceTodayScreen />
            ) : (
              <AttendanceHistoryScreen />
            ))}
          {activeTab === 'timesheet' && <TodayTimesheetScreen />}
          {activeTab === 'timesheet-monthly' && <MonthlyTimesheetScreen />}
          {activeTab === 'leave' && <MyLeaveScreen />}
          {activeTab === 'approvals' && <ApprovalsScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
          {activeTab === 'kiosk' && <KioskModeScreen />}
          {activeTab === 'payslips' && <PayslipsScreen />}
          {activeTab === 'announcements' && <AnnouncementsScreen />}
          {activeTab === 'helpdesk' && <HelpdeskScreen />}

          {/* Phase 2 Sub-routes */}
          {activeTab === 'phase2-expenses' && <Phase2HubScreen initialModule="expenses" />}
          {activeTab === 'phase2-hrletters' && <Phase2HubScreen initialModule="hrletters" />}
          {activeTab === 'phase2-tax' && <Phase2HubScreen initialModule="tax" />}
          {activeTab === 'phase2-directory' && <Phase2HubScreen initialModule="directory" />}
        </main>

        {/* Bottom Navigation (hidden on Kiosk) */}
        {activeTab !== 'kiosk' && <BottomNav />}

        {/* Modals & Overlays */}
        {activeModal === 'add-leave' && <AddLeaveModal />}
        {activeModal === 'add-timesheet' && <AddTimeSheetModal />}
        {activeModal === 'regularization' && <RegularizationModal />}
        {activeModal === 'ai-assistant' && <AIAssistantModal />}
        {activeModal === 'team-calendar' && <TeamLeaveCalendarModal />}
        {activeModal === 'notifications' && <NotificationsScreen />}
        {activeModal === 'holidays' && <HolidaysScreen />}
        {activeModal === 'quick-punch' && <QuickPunchWidget />}

        {/* DPDP Act 2023 First-Login Privacy Consent */}
        <PrivacyConsentModal />

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
}
