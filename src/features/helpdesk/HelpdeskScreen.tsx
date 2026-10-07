import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { HelpdeskTicket } from '../../types';
import {
  HelpCircle,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Paperclip,
} from 'lucide-react';

export const HelpdeskScreen: React.FC = () => {
  const { showToast } = useAppStore();
  const [tickets, setTickets] = useState<HelpdeskTicket[]>(() => apiService.getHelpdeskTickets());
  const [showNewForm, setShowNewForm] = useState(false);
  const [category, setCategory] = useState<HelpdeskTicket['category']>('Attendance & Biometric');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<HelpdeskTicket['priority']>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const newT = await apiService.createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      setTickets((prev) => [newT, ...prev]);
      setShowNewForm(false);
      setSubject('');
      setDescription('');
      showToast(`Helpdesk Ticket ${newT.ticketNo} created successfully.`, 'success');
    } catch {
      showToast('Failed to create ticket.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">HR & IT Helpdesk</h2>
          <p className="text-xs text-slate-400">
            Raise requests for payroll queries, attendance discrepancies & IT support
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* New Ticket Form */}
      {showNewForm && (
        <form
          onSubmit={handleCreateTicket}
          className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3.5 shadow-xl animate-in fade-in"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Create Support Ticket
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Category*
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Attendance & Biometric">Attendance & Biometric</option>
                <option value="Payroll & Salary">Payroll & Salary</option>
                <option value="Leave Balance">Leave Balance</option>
                <option value="IT & Hardware">IT & Hardware</option>
                <option value="HR Policies">HR Policies</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Subject*
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Geofence radius issue at Surat gate"
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Description*
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of the problem..."
              rows={3}
              required
              className="w-full bg-[#18233e] border border-[#243456] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#243456]">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      )}

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-2.5 shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {t.ticketNo}
                  </span>
                  <span className="text-xs font-bold text-white">{t.subject}</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Category: {t.category} · Priority: {t.priority}
                </span>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  t.status === 'RESOLVED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                {t.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 bg-[#18233e] p-2.5 rounded-xl border border-[#243456]/50">
              {t.description}
            </p>

            {t.resolutionNote && (
              <div className="bg-[#12261f] p-2 rounded-lg text-emerald-300 text-[11px] border border-emerald-800/40">
                <span className="font-bold">Resolution Note:</span> {t.resolutionNote}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
