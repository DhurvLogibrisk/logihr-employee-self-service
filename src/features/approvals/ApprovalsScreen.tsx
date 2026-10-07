import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import {
  CheckSquare,
  Check,
  X,
  MessageSquare,
  Users,
  Clock,
  CalendarCheck,
  FileSpreadsheet,
  Home,
  CheckCircle2,
} from 'lucide-react';

export const ApprovalsScreen: React.FC = () => {
  const { approvals, refreshData, showToast, profile } = useAppStore();

  const [activeSegment, setActiveSegment] = useState<'ALL' | 'LEAVE' | 'REGULARIZATION' | 'TIMESHEET' | 'WFH'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [commentModalId, setCommentModalId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  const filteredApprovals = pendingApprovals.filter((a) => {
    if (activeSegment === 'ALL') return true;
    return a.type === activeSegment;
  });

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await apiService.reviewApproval(id, 'APPROVED');
      refreshData();
      showToast('Request approved successfully.', 'success');
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!commentModalId) return;
    setIsProcessing(true);
    try {
      await apiService.reviewApproval(commentModalId, 'REJECTED', rejectComment || 'Declined by manager.');
      refreshData();
      showToast('Request rejected with feedback.', 'info');
      setCommentModalId(null);
      setRejectComment('');
      setSelectedIds((prev) => prev.filter((i) => i !== commentModalId));
    } catch {
      showToast('Failed to reject request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      for (const id of selectedIds) {
        await apiService.reviewApproval(id, 'APPROVED');
      }
      refreshData();
      showToast(`Bulk approved ${selectedIds.length} team requests.`, 'success');
      setSelectedIds([]);
    } catch {
      showToast('Bulk approval encountered an error.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Team Attendance Today Overview Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Team Attendance Today
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">5 Direct Reports</span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-[#18233e] rounded-xl p-2 border border-[#243456]/60">
            <span className="text-[10px] font-bold text-slate-400 block">Present</span>
            <span className="text-base font-black font-mono text-emerald-400 mt-0.5 block">
              3
            </span>
          </div>
          <div className="bg-[#18233e] rounded-xl p-2 border border-[#243456]/60">
            <span className="text-[10px] font-bold text-slate-400 block">Late</span>
            <span className="text-base font-black font-mono text-amber-400 mt-0.5 block">
              1
            </span>
          </div>
          <div className="bg-[#18233e] rounded-xl p-2 border border-[#243456]/60">
            <span className="text-[10px] font-bold text-slate-400 block">On Leave</span>
            <span className="text-base font-black font-mono text-blue-400 mt-0.5 block">
              1
            </span>
          </div>
          <div className="bg-[#18233e] rounded-xl p-2 border border-[#243456]/60">
            <span className="text-[10px] font-bold text-slate-400 block">Absent</span>
            <span className="text-base font-black font-mono text-rose-400 mt-0.5 block">
              0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Segments Filter: Leave, Regularization, Timesheet, WFH */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'All Items' },
          { id: 'LEAVE', label: 'Leave' },
          { id: 'REGULARIZATION', label: 'Regularization' },
          { id: 'TIMESHEET', label: 'Timesheet' },
          { id: 'WFH', label: 'WFH' },
        ].map((seg) => (
          <button
            key={seg.id}
            onClick={() => setActiveSegment(seg.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSegment === seg.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-[#121a2f] text-slate-400 hover:text-slate-200 border border-[#243456]'
            }`}
          >
            {seg.label}
          </button>
        ))}
      </div>

      {/* Bulk action toolbar if items selected */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-950/80 border border-blue-600/60 rounded-xl p-3 flex items-center justify-between text-xs text-blue-200 shadow-lg">
          <span className="font-bold">{selectedIds.length} requests selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300"
            >
              Deselect
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
            >
              Bulk Approve
            </button>
          </div>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-200">All caught up!</h4>
            <p className="text-[11px] text-slate-400">
              No pending approval requests in this category.
            </p>
          </div>
        ) : (
          filteredApprovals.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-[#121a2f] border rounded-2xl p-4 space-y-3 transition-all shadow-md ${
                  isSelected ? 'border-blue-500 bg-[#16223d]' : 'border-[#243456]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 bg-[#18233e] border-[#243456]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {item.requesterName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({item.requesterEmpId})
                        </span>
                        {(item.requesterEmpId === profile.empCode || item.details?.employeeId === profile.id) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                            Your Request
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-cyan-300 mt-0.5">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    {item.dateIST}
                  </span>
                </div>

                {/* Subtitle / Details */}
                <div className="bg-[#18233e] rounded-xl p-2.5 text-xs text-slate-300 border border-[#243456]/60">
                  {item.subtitle}
                </div>

                {/* Actions: Approve / Reject */}
                {(() => {
                  const isSelf = item.requesterEmpId === profile.empCode || item.details?.employeeId === profile.id;
                  return (
                    <div className="flex items-center justify-between pt-1 border-t border-[#243456]/50">
                      {isSelf ? (
                        <span className="text-[10px] text-amber-400/90 italic">
                          Self-approval prohibited by policy
                        </span>
                      ) : <span />}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCommentModalId(item.id);
                            setRejectComment('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#18233e] hover:bg-rose-950 border border-[#243456] hover:border-rose-700 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={isProcessing || isSelf}
                          title={isSelf ? 'Employees cannot approve their own requests' : undefined}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Rejection comment modal */}
      {commentModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Provide Rejection Reason</h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. Please discuss with team lead before re-applying."
              rows={3}
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCommentModalId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
