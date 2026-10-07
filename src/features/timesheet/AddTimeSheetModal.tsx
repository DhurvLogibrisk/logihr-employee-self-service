import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { TimesheetRow } from '../../types';
import { searchIntegrationTasks, IntegrationTask } from '../../services/integrationService';
import { X, Plus, Trash2, Copy, Sparkles, AlertCircle, CheckCircle2, Mic } from 'lucide-react';

const ACTIVITIES = [
  'Requirements Analysis',
  'Backend Architecture',
  'Mobile App UI',
  'API Integration',
  'Testing & QA',
  'Client Demo Review',
  'Sprint Planning',
  'Database Optimization',
  'Code Review & Refactoring',
  'Bug Fixing',
];

export const AddTimeSheetModal: React.FC = () => {
  const { closeModal, showToast, refreshData, todayTimesheetRows } = useAppStore();

  const [timesheetDate, setTimesheetDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [rows, setRows] = useState<TimesheetRow[]>(() => {
    if (todayTimesheetRows && todayTimesheetRows.length > 0) {
      return JSON.parse(JSON.stringify(todayTimesheetRows));
    }
    return [
      {
        id: `row-${Date.now()}-1`,
        startTime: '09:30',
        endTime: '13:30',
        hours: '04:00',
        hoursDecimal: 4.0,
        taskNo: 'LB-402',
        modualTaskActivity: 'Requirements Analysis',
        description: 'Review client requirements and finalize API contracts with backend team.',
      },
    ];
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskSuggestions, setTaskSuggestions] = useState<{ [rowId: string]: IntegrationTask[] }>({});

  const startTimeRefs = useRef<{ [rowId: string]: HTMLInputElement | null }>({});

  // Helper to compute HH:MM difference
  const calculateRowHours = (start: string, end: string): { formatted: string; decimal: number; diffMinutes: number } => {
    if (!start || !end) return { formatted: '00:00', decimal: 0, diffMinutes: 0 };
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const diff = endTotal - startTotal;
    if (diff <= 0) return { formatted: '00:00', decimal: 0, diffMinutes: diff };

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return { formatted, decimal: Number((diff / 60).toFixed(2)), diffMinutes: diff };
  };

  // Recalculate row hours whenever start/end times change
  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', val: string) => {
    setRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: val };
      const res = calculateRowHours(target.startTime, target.endTime);
      target.hours = res.formatted;
      target.hoursDecimal = res.decimal;
      updated[index] = target;
      return updated;
    });
  };

  const handleFieldChange = (index: number, field: keyof TimesheetRow, val: any) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Task search auto-suggest
  const handleTaskNoInput = async (rowId: string, index: number, query: string) => {
    handleFieldChange(index, 'taskNo', query);
    if (query.length >= 2) {
      const results = await searchIntegrationTasks(query);
      setTaskSuggestions((prev) => ({ ...prev, [rowId]: results }));
    } else {
      setTaskSuggestions((prev) => ({ ...prev, [rowId]: [] }));
    }
  };

  const selectTaskSuggestion = (index: number, rowId: string, task: IntegrationTask) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        taskNo: task.taskKey,
        modualTaskActivity: task.suggestedActivity,
        description: updated[index].description || task.title,
      };
      return updated;
    });
    setTaskSuggestions((prev) => ({ ...prev, [rowId]: [] }));
  };

  // Add detail time
  const handleAddRow = (afterIndex?: number) => {
    const lastRow = rows[rows.length - 1];
    const newStart = lastRow && lastRow.endTime ? lastRow.endTime : '14:00';
    // Default 1 hour later
    const [h, m] = newStart.split(':').map(Number);
    const endH = (h + 2) % 24;
    const newEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const newRowId = `row-${Date.now()}-${Math.random()}`;
    const newRow: TimesheetRow = {
      id: newRowId,
      startTime: newStart,
      endTime: newEnd,
      hours: calculateRowHours(newStart, newEnd).formatted,
      hoursDecimal: calculateRowHours(newStart, newEnd).decimal,
      taskNo: '',
      modualTaskActivity: '',
      description: '',
    };

    setRows((prev) => {
      if (afterIndex !== undefined) {
        const copy = [...prev];
        copy.splice(afterIndex + 1, 0, newRow);
        return copy;
      }
      return [...prev, newRow];
    });

    // Auto focus next start time
    setTimeout(() => {
      startTimeRefs.current[newRowId]?.focus();
    }, 100);
  };

  // Delete row (must leave at least 1)
  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      setValidationError('At least one timesheet row must remain.');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Enter in description adds row
  const handleDescriptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddRow(index);
    }
  };

  // Copy yesterday helper
  const handleCopyYesterday = () => {
    const yesterdayRows: TimesheetRow[] = [
      {
        id: `row-y-${Date.now()}-1`,
        startTime: '09:30',
        endTime: '13:30',
        hours: '04:00',
        hoursDecimal: 4.0,
        taskNo: 'LB-399',
        modualTaskActivity: 'Sprint Planning',
        description: 'Roadmap review and milestone allocation with Vikram.',
      },
      {
        id: `row-y-${Date.now()}-2`,
        startTime: '14:30',
        endTime: '18:30',
        hours: '04:00',
        hoursDecimal: 4.0,
        taskNo: 'LB-401',
        modualTaskActivity: 'Testing & QA',
        description: 'Biometric device binding security audit and geofence verification.',
      },
    ];
    setRows(yesterdayRows);
    showToast('Copied rows from yesterday. You can edit task descriptions.', 'info');
  };

  // Compute total hours
  const totalMinutes = rows.reduce((acc, row) => {
    const [h, m] = row.hours.split(':').map(Number);
    return acc + (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m);
  }, 0);
  const totalHrs = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const totalHoursFormatted = `${String(totalHrs).padStart(2, '0')}:${String(totalMins).padStart(2, '0')}`;

  // Validate form
  const validateRows = (): boolean => {
    setValidationError(null);
    setWarningMessage(null);

    // 1. Cannot be future date
    const todayStr = new Date().toISOString().split('T')[0];
    if (timesheetDate > todayStr) {
      setValidationError('Timesheet Date cannot be a future date.');
      return false;
    }

    // 2. Check each row
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.startTime || !r.endTime) {
        setValidationError(`Row #${i + 1}: Start Time and End Time are required.`);
        return false;
      }
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (endMin <= startMin) {
        setValidationError(`Row #${i + 1}: End Time must be greater than Start Time.`);
        return false;
      }
      if (!r.taskNo.trim()) {
        setValidationError(`Row #${i + 1}: TASK NO is required.`);
        return false;
      }
      if (!r.modualTaskActivity) {
        setValidationError(`Row #${i + 1}: Please select MODUAL TASK ACTIVITY.`);
        return false;
      }
      if (!r.description.trim()) {
        setValidationError(`Row #${i + 1}: DESCRIPTION is required.`);
        return false;
      }
    }

    // 3. Overlap check between rows
    for (let i = 0; i < rows.length; i++) {
      const [s1h, s1m] = rows[i].startTime.split(':').map(Number);
      const [e1h, e1m] = rows[i].endTime.split(':').map(Number);
      const start1 = s1h * 60 + s1m;
      const end1 = e1h * 60 + e1m;

      for (let j = i + 1; j < rows.length; j++) {
        const [s2h, s2m] = rows[j].startTime.split(':').map(Number);
        const [e2h, e2m] = rows[j].endTime.split(':').map(Number);
        const start2 = s2h * 60 + s2m;
        const end2 = e2h * 60 + e2m;

        if (start1 < end2 && end1 > start2) {
          setValidationError(
            `Overlapping time detected between Row #${i + 1} (${rows[i].startTime}-${rows[i].endTime}) and Row #${j + 1} (${rows[j].startTime}-${rows[j].endTime}).`
          );
          return false;
        }
      }
    }

    // 4. Total <= 24 hours
    if (totalMinutes > 24 * 60) {
      setValidationError('Total timesheet hours cannot exceed 24:00 hours.');
      return false;
    }

    // 5. Compare with attendance hours (Warn if diff > 1h)
    // Assume 8h work shift
    if (totalMinutes < 420) {
      setWarningMessage('Note: Total hours logged is less than 07:00 hours.');
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRows()) return;

    setIsSubmitting(true);
    try {
      await apiService.saveTodayTimesheet(rows);
      refreshData();
      showToast(`TimeSheet saved successfully (${totalHoursFormatted} total hours).`, 'success');
      closeModal();
    } catch {
      setValidationError('Failed to save timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#121a2f] border border-[#243456] rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header "Add Time Sheet" with close (x) */}
        <div className="px-5 py-3.5 border-b border-[#243456] flex items-center justify-between bg-[#18233e]">
          <h2 className="text-base font-bold text-white tracking-tight">Add Time Sheet</h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#243456] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Helpers & Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#18233e]/60 p-3 rounded-xl border border-[#243456]/60">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                TimeSheet Date
              </label>
              <input
                type="date"
                value={timesheetDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setTimesheetDate(e.target.value)}
                className="bg-[#121a2f] border border-[#243456] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyYesterday}
                className="px-3 py-1.5 rounded-lg bg-[#243456] hover:bg-[#2d426d] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                Copy Yesterday
              </button>
            </div>
          </div>

          {/* "+ ADD DETAIL TIME" link */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              + ADD DETAIL TIME
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {rows.length} row{rows.length > 1 ? 's' : ''} added
            </span>
          </div>

          {/* Tip text */}
          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/50 text-[11px] text-cyan-300/90 leading-relaxed">
            <span className="font-semibold text-cyan-300">Tip:</span> Enter start/end time, pick activity, and press Enter in description to add next row quickly.
          </div>

          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {warningMessage && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-600/50 text-amber-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Rows Builder */}
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="bg-[#18233e] border border-[#243456] rounded-xl p-3.5 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b border-[#243456]/50 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Detail #{index + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddRow(index)}
                      className="p-1 rounded bg-[#243456] hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                      title="Add row below"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="p-1 rounded bg-[#243456] hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* START TIME, END TIME, HOURS */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      START TIME
                    </label>
                    <input
                      type="time"
                      ref={(el) => {
                        startTimeRefs.current[row.id] = el;
                      }}
                      value={row.startTime}
                      onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                      required
                      className="w-full bg-[#121a2f] border border-[#243456] rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      END TIME
                    </label>
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                      required
                      className="w-full bg-[#121a2f] border border-[#243456] rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      HOURS
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={row.hours}
                      className="w-full bg-[#0a0f1d] border border-[#243456] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* TASK NO & MODUAL TASK ACTIVITY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      TASK NO
                    </label>
                    <input
                      type="text"
                      placeholder="Task No (e.g. LB-402)"
                      value={row.taskNo}
                      onChange={(e) => handleTaskNoInput(row.id, index, e.target.value)}
                      required
                      className="w-full bg-[#121a2f] border border-[#243456] rounded-lg px-2.5 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-blue-500"
                    />
                    {/* Auto-suggest dropdown */}
                    {taskSuggestions[row.id] && taskSuggestions[row.id].length > 0 && (
                      <div className="absolute left-0 right-0 z-30 mt-1 bg-[#121a2f] border border-[#243456] rounded-xl shadow-2xl p-1 max-h-40 overflow-y-auto">
                        <div className="text-[10px] text-cyan-400 font-semibold px-2 py-1">
                          Suggested from Jira / GitHub
                        </div>
                        {taskSuggestions[row.id].map((task) => (
                          <div
                            key={task.id}
                            onClick={() => selectTaskSuggestion(index, row.id, task)}
                            className="px-2.5 py-1.5 hover:bg-[#18233e] rounded-lg cursor-pointer text-[11px] text-slate-200"
                          >
                            <span className="font-bold text-blue-400">{task.taskKey}</span>: {task.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      MODUAL TASK ACTIVITY
                    </label>
                    <select
                      value={row.modualTaskActivity}
                      onChange={(e) => handleFieldChange(index, 'modualTaskActivity', e.target.value)}
                      required
                      className="w-full bg-[#121a2f] border border-[#243456] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">--SELECT--</option>
                      {ACTIVITIES.map((act) => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      DESCRIPTION
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Press Enter to add next row
                    </span>
                  </div>
                  <textarea
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                    onKeyDown={(e) => handleDescriptionKeyDown(e, index)}
                    rows={2}
                    required
                    className="w-full bg-[#121a2f] border border-[#243456] rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer: Total Hours (HH:MM) */}
          <div className="p-3.5 rounded-xl bg-[#18233e] border border-[#243456] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Total Hours
            </span>
            <span className="text-base font-black font-mono text-cyan-300">
              {totalHoursFormatted}
            </span>
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
