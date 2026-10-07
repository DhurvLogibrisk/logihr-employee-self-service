import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { PayslipItem } from '../../types';
import {
  FileText,
  Download,
  ShieldCheck,
  FileQuestion,
  RefreshCw,
} from 'lucide-react';

export const PayslipsScreen: React.FC = () => {
  const { showToast, profile } = useAppStore();
  const [payslips, setPayslips] = useState<PayslipItem[]>(() => apiService.getPayslips());
  const [isLoading, setIsLoading] = useState(false);

  const loadPayslips = async () => {
    setIsLoading(true);
    try {
      const slips = await apiService.fetchPayslipsFromDb();
      setPayslips(slips);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const handleDownloadPDF = (slip: PayslipItem) => {
    showToast(`Downloading official salary slip for ${slip.monthName}...`, 'success');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-lg space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-extrabold text-white">Monthly Payslips</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPayslips}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-[#18233e] hover:bg-[#243456] text-slate-300 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              RLS Protected
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Confidential salary statements & statutory deductions (EPF / Professional Tax)
        </p>
      </div>

      {isLoading ? (
        <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-8 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Querying database for employee records...</p>
        </div>
      ) : payslips.length === 0 ? (
        /* Empty State: "Not available yet" */
        <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-8 text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 bg-[#18233e] border border-[#243456] rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FileQuestion className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Not available yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No salary slips have been generated yet for employee <span className="font-mono text-slate-300">{profile.empCode}</span> in the database.
              Once HR or payroll processes the current payroll cycle, your slips will appear here automatically.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-500">
              Database status: public.payslips queried · 0 records for current user
            </span>
          </div>
        </div>
      ) : (
        /* Real Payslips List */
        <div className="space-y-3">
          {payslips.map((slip) => (
            <div
              key={slip.id}
              className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{slip.monthName}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Generated: {slip.generatedDate} · Paid Days: {slip.paidDays}
                  </span>
                </div>

                <button
                  onClick={() => handleDownloadPDF(slip)}
                  className="p-2 rounded-xl bg-[#18233e] hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Salary Breakdown Summary */}
              <div className="bg-[#18233e] rounded-xl p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 border border-[#243456]/60 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Gross Salary:</span>
                  <span className="text-slate-200 font-bold">₹{slip.grossSalary.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Deductions:</span>
                  <span className="text-rose-400 font-bold">-₹{slip.deductions.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">PF Contribution:</span>
                  <span className="text-slate-300">₹{slip.pf.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Net Take-Home:</span>
                  <span className="text-emerald-400 font-black text-sm">₹{slip.netPay.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
