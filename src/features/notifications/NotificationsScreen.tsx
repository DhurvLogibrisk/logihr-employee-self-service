import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import {
  Bell,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Megaphone,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    refreshData,
    showToast,
    closeModal,
    setActiveTab,
  } = useAppStore();

  const handleActionApprove = async (approvalId?: string) => {
    if (!approvalId) return;
    try {
      await apiService.reviewApproval(approvalId, 'APPROVED');
      refreshData();
      showToast('Approved directly from actionable notification.', 'success');
    } catch {
      showToast('Could not approve.', 'error');
    }
  };

  const handleActionReject = async (approvalId?: string) => {
    if (!approvalId) return;
    try {
      await apiService.reviewApproval(approvalId, 'REJECTED', 'Declined via notification quick-action');
      refreshData();
      showToast('Rejected directly from notification.', 'info');
    } catch {
      showToast('Could not reject.', 'error');
    }
  };

  const handleItemClick = (n: any) => {
    apiService.markNotificationAsRead(n.id);
    refreshData();
    if (n.category === 'ATTENDANCE') {
      setActiveTab('attendance');
      closeModal();
    } else if (n.category === 'APPROVAL') {
      setActiveTab('approvals');
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#243456] flex items-center justify-between bg-[#18233e]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Notification Center
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456]"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                n.read
                  ? 'bg-[#18233e]/50 border-[#243456]/40 opacity-80'
                  : 'bg-[#18233e] border-blue-500/50 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() => handleItemClick(n)}
                  className="cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {n.body}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                    {n.timestampIST}
                  </span>
                </div>
              </div>

              {/* Actionable buttons directly in notification */}
              {n.actionable && (
                <div className="mt-3 pt-2 border-t border-[#243456]/50 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleActionReject(n.approvalId)}
                    className="px-2.5 py-1 rounded-lg bg-[#121a2f] hover:bg-rose-950 text-rose-300 text-[11px] font-semibold border border-[#243456] flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleActionApprove(n.approvalId)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#243456] bg-[#18233e]">
          <button
            onClick={closeModal}
            className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
