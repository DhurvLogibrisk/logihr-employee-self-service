import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { LeaveTypeCode } from '../../types';
import { X, Calendar, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AddLeaveModal: React.FC = () => {
  const { closeModal, showToast, refreshData, leaveBalances, leaveRequests, profile } = useAppStore();

  const [employeeName, setEmployeeName] = useState(profile.name ? `${profile.name} (${profile.empCode})` : 'Active Employee');
  const [leaveType, setLeaveType] = useState<string>('');
  const [leaveTypeCode, setLeaveTypeCode] = useState<LeaveTypeCode | ''>('');
  const [fromDate, setFromDate] = useState('12/10/2026 09:30 AM');
  const [toDate, setToDate] = useState('13/10/2026 06:30 PM');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [noOfDays, setNoOfDays] = useState<number>(2);
  const [reason, setReason] = useState('');
  const [approverName, setApproverName] = useState(profile.reportingManager || 'Reporting Manager');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculate no of days based on dates, half day flag, weekends, and holidays
  useEffect(() => {
    if (isHalfDay) {
      setNoOfDays(0.5);
      return;
    }

    try {
      // Parse DD/MM/YYYY
      const parseDatePart = (str: string) => {
        const [dPart] = str.split(' ');
        const [d, m, y] = dPart.split('/').map(Number);
        return new Date(y, m - 1, d);
      };

      const start = parseDatePart(fromDate);
      const end = parseDatePart(toDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        setNoOfDays(0);
        return;
      }

      // Calculate working days excluding Sat & Sun
      let daysCount = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const dayOfWeek = cur.getDay(); // 0 is Sun, 6 is Sat
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysCount += 1;
        }
        cur.setDate(cur.getDate() + 1);
      }

      setNoOfDays(Math.max(1, daysCount));
    } catch {
      setNoOfDays(1);
    }
  }, [fromDate, toDate, isHalfDay]);

  // Handle leave type select change
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setLeaveType(val);
    if (val === 'Casual Leave') setLeaveTypeCode('CASUAL_LEAVE');
    else if (val === 'Sick Leave') setLeaveTypeCode('SICK_LEAVE');
    else if (val === 'Earned/Privilege Leave') setLeaveTypeCode('EARNED_LEAVE');
    else if (val === 'Compensatory Off') setLeaveTypeCode('COMP_OFF');
    else if (val === 'Leave Without Pay') setLeaveTypeCode('LEAVE_WITHOUT_PAY');
    else setLeaveTypeCode('');
  };

  const selectedBalance = leaveBalances.find((b) => b.code === leaveTypeCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!leaveType) {
      setValidationError('Please select a Leave Type.');
      return;
    }
    if (!reason.trim()) {
      setValidationError('Please provide a reason for the leave.');
      return;
    }
    if (selectedBalance && selectedBalance.code !== 'LEAVE_WITHOUT_PAY' && noOfDays > selectedBalance.balance) {
      setValidationError(
        `Insufficient leave balance. You requested ${noOfDays} day(s), but have only ${selectedBalance.balance} day(s) available in ${selectedBalance.name}.`
      );
      return;
    }

    // Overlap check
    const hasOverlap = leaveRequests.some(
      (r) => r.status !== 'CANCELLED' && r.status !== 'REJECTED' && r.fromDate === fromDate
    );
    if (hasOverlap) {
      setValidationError('A leave application already exists for this exact date window.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.applyLeave({
        employeeId: 'emp-00125',
        employeeName,
        leaveType,
        leaveTypeCode: (leaveTypeCode as LeaveTypeCode) || 'CASUAL_LEAVE',
        fromDate,
        toDate,
        isHalfDay,
        noOfDays,
        reason: reason.trim(),
        approverName,
        attachmentName: attachment ? attachment.name : undefined,
      });

      refreshData();
      showToast(`Leave application submitted successfully for ${noOfDays} day(s).`, 'success');
      closeModal();
    } catch {
      setValidationError('Failed to submit leave. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header "Add Leave" with close (x) */}
        <div className="px-5 py-4 border-b border-[#243456] flex items-center justify-between bg-[#18233e]">
          <h2 className="text-base font-bold text-white tracking-tight">Add Leave</h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Available-balance banner */}
          {selectedBalance && (
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-600/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedBalance.color }}
                />
                <span className="font-semibold text-slate-200">
                  {selectedBalance.name} Balance:
                </span>
              </div>
              <div className="font-mono font-bold text-cyan-300">
                {selectedBalance.balance} / {selectedBalance.total} Days Left
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Employee Name* */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Employee Name*
            </label>
            <select
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value={`${profile.name} (${profile.empCode})`}>{profile.name} ({profile.empCode})</option>
            </select>
          </div>

          {/* 2. Leave Type* */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Leave Type*
            </label>
            <select
              value={leaveType}
              onChange={handleLeaveTypeChange}
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">--SELECT--</option>
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick Leave">Sick Leave (SL)</option>
              <option value="Earned/Privilege Leave">Earned/Privilege Leave (EL)</option>
              <option value="Compensatory Off">Compensatory Off (Comp-off)</option>
              <option value="Leave Without Pay">Leave Without Pay (LWP)</option>
            </select>
          </div>

          {/* 3. From Date* & 4. To Date* */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                From Date*
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="DD/MM/YYYY hh:mm A"
                  required
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                To Date*
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="DD/MM/YYYY hh:mm A"
                  required
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 5. Is Half Day & 6. No Of Days */}
          <div className="grid grid-cols-2 gap-3 items-center bg-[#18233e]/50 p-3 rounded-xl border border-[#243456]/60">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#121a2f] border-[#243456]"
              />
              <span className="text-xs font-semibold text-slate-200">Is Half Day</span>
            </label>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                No Of Days
              </span>
              <input
                type="text"
                readOnly
                value={noOfDays}
                className="w-full bg-[#121a2f] border border-[#243456] rounded-lg px-2.5 py-1.5 text-xs font-bold text-cyan-300 cursor-not-allowed"
              />
            </div>
          </div>

          {/* 7. Reason* */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason*
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              rows={3}
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* 8. Approvers Name* */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Approvers Name*
            </label>
            <select
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value={profile.reportingManager || 'Reporting Manager'}>{profile.reportingManager || 'Reporting Manager'}</option>
              <option value="HR Admin Department">HR Admin Department</option>
            </select>
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Attachment (Optional / Doctor's Note)
            </label>
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#243456] hover:border-slate-400 rounded-xl cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors bg-[#18233e]/30">
              <Upload className="w-4 h-4 text-blue-400" />
              <span className="truncate">
                {attachment ? attachment.name : 'Choose file (PDF, PNG, JPG)'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Bottom buttons: Close (grey) and Save (blue) */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#243456]">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
