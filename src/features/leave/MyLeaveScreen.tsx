import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { LeaveRequest } from '../../types';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
} from 'lucide-react';

export const MyLeaveScreen: React.FC = () => {
  const { leaveRequests, leaveBalances, openModal, refreshData, showToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const counts = {
    ALL: leaveRequests.length,
    PENDING: leaveRequests.filter((r) => r.status === 'PENDING').length,
    APPROVED: leaveRequests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: leaveRequests.filter((r) => r.status === 'REJECTED').length,
  };

  const filteredRequests = leaveRequests.filter((r) => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const handleCancelLeave = async (id: string) => {
    setCancellingId(id);
    try {
      const ok = await apiService.cancelLeave(id);
      if (ok) {
        refreshData();
        showToast('Pending leave application cancelled successfully.', 'info');
      }
    } catch {
      showToast('Could not cancel leave.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Leave Balances Ribbon */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Available Leave Quota
          </span>
          <button
            onClick={() => openModal('team-calendar')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" />
            Team Calendar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {leaveBalances.slice(0, 4).map((lb) => (
            <div
              key={lb.code}
              className="bg-[#18233e] rounded-xl p-2.5 text-center border border-[#243456]/50"
            >
              <span className="text-[10px] font-bold text-slate-400 block truncate">
                {lb.shortCode}
              </span>
              <span className="text-base font-black font-mono text-cyan-300 mt-0.5 block">
                {lb.balance}
              </span>
              <span className="text-[9px] text-slate-500 font-medium block">
                Used: {lb.used}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented Tabs (All / Pending / Approved / Rejected with counts) */}
      <div className="flex items-center gap-1 bg-[#121a2f] p-1 rounded-xl border border-[#243456]">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab ? 'bg-blue-800 text-white' : 'bg-[#18233e] text-slate-400'
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-300">No {activeTab.toLowerCase()} leave requests</h4>
            <p className="text-[11px] text-slate-500">
              Need time off? Tap the Add Leave button below.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isApproved = req.status === 'APPROVED';
            const isRejected = req.status === 'REJECTED';
            const isCancelled = req.status === 'CANCELLED';

            return (
              <div
                key={req.id}
                className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-md"
              >
                {/* Top: Leave type + Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {req.leaveType}
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold mt-0.5 block">
                      {req.noOfDays} Day{req.noOfDays > 1 ? 's' : ''} {req.isHalfDay ? '(Half Day)' : ''}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      isPending
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                        : isApproved
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : isRejected
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Dates & Reason */}
                <div className="bg-[#18233e] rounded-xl p-3 text-xs space-y-1.5 border border-[#243456]/60">
                  <div className="text-slate-300">
                    <span className="text-slate-500">Duration: </span>
                    <span className="font-mono text-white">{req.fromDate}</span> to <span className="font-mono text-white">{req.toDate}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Reason: </span>
                    <span>{req.reason}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] pt-1 border-t border-[#243456]/40 flex items-center justify-between">
                    <span>Approver: {req.approverName}</span>
                    <span>Applied: {req.appliedDateIST}</span>
                  </div>
                  {req.managerComment && (
                    <div className="bg-[#121a2f] p-2 rounded-lg text-emerald-300 text-[11px]">
                      <span className="font-semibold">Manager Note:</span> {req.managerComment}
                    </div>
                  )}
                </div>

                {/* Actions: Cancel if Pending */}
                {isPending && (
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleCancelLeave(req.id)}
                      disabled={cancellingId === req.id}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-semibold transition-colors"
                    >
                      {cancellingId === req.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating "+" Add Leave button */}
      <button
        onClick={() => openModal('add-leave')}
        className="fixed bottom-20 right-4 z-30 p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/40 flex items-center justify-center transition-transform active:scale-95 focus:outline-none"
        aria-label="Add Leave"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
