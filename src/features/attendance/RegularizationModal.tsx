import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

export const RegularizationModal: React.FC = () => {
  const { closeModal, showToast, refreshData, profile } = useAppStore();

  const [date, setDate] = useState<string>(() => {
    const yesterday = new Date(Date.now() - 86400000);
    return yesterday.toISOString().split('T')[0];
  });
  const [punchType, setPunchType] = useState<'In' | 'Out' | 'Both'>('Out');
  const [proposedInTime, setProposedInTime] = useState('09:30');
  const [proposedOutTime, setProposedOutTime] = useState('18:30');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please describe the reason for missing the punch.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.submitRegularization({
        employeeId: profile.id,
        employeeName: profile.name,
        date,
        punchType,
        proposedInTime: punchType === 'In' || punchType === 'Both' ? proposedInTime : undefined,
        proposedOutTime: punchType === 'Out' || punchType === 'Both' ? proposedOutTime : undefined,
        reason: reason.trim(),
      });

      refreshData();
      showToast(`Attendance regularization request submitted for ${date}.`, 'success');
      closeModal();
    } catch {
      setError('Failed to submit regularization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#243456] flex items-center justify-between bg-[#18233e]">
          <h2 className="text-base font-bold text-white tracking-tight">
            Apply for Regularization
          </h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attendance Date*
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Punch Type (In / Out / Both) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Punch Type to Regularize*
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['In', 'Out', 'Both'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setPunchType(type)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    punchType === type
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                      : 'bg-[#18233e] border-[#243456] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type === 'Both' ? 'Both Punches' : `Check ${type}`}
                </button>
              ))}
            </div>
          </div>

          {/* Proposed Times */}
          <div className="grid grid-cols-2 gap-3">
            {(punchType === 'In' || punchType === 'Both') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Proposed In Time*
                </label>
                <input
                  type="time"
                  value={proposedInTime}
                  onChange={(e) => setProposedInTime(e.target.value)}
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {(punchType === 'Out' || punchType === 'Both') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Proposed Out Time*
                </label>
                <input
                  type="time"
                  value={proposedOutTime}
                  onChange={(e) => setProposedOutTime(e.target.value)}
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Missed Punch*
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Biometric gate malfunction, immediate client on-site visit, power outage."
              rows={3}
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Approver Info */}
          <div className="p-3 rounded-xl bg-[#18233e]/50 border border-[#243456] text-xs text-slate-300">
            <span className="text-slate-400">Approving Manager:</span>{' '}
            <span className="font-semibold text-white">Vikram Shah (Director)</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#243456]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
