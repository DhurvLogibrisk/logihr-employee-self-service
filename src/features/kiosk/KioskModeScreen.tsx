import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { serverTimeService } from '../../services/serverTimeService';
import {
  Camera,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Scan,
  Lock,
  ChevronLeft,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const KioskModeScreen: React.FC = () => {
  const { setActiveTab, liveServerTime, showToast, profile } = useAppStore();

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const [isScanning, setIsScanning] = useState(false);
  const [selectedPunchType, setSelectedPunchType] = useState<'IN' | 'OUT'>('IN');
  const [targetEmpCode, setTargetEmpCode] = useState(profile.empCode);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    name: string;
    empCode: string;
    punchTime: string;
    punchType: string;
  } | null>(null);

  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const triggerFaceRecognitionPunch = () => {
    if (!isDemoMode) {
      showToast('Face-scan simulation disabled in production. Set VITE_DEMO_MODE=true for demonstration.', 'warning');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Simulated neural face embedding verification (Demo only)
    setTimeout(async () => {
      setIsScanning(false);
      const serverNow = serverTimeService.getCurrentServerTimeFormattedIST();

      // Only stamp punch for the authenticated and selected employee
      const employeeName = targetEmpCode === profile.empCode ? profile.name : 'Verified Employee';

      await apiService.recordPunch({
        type: selectedPunchType,
        workMode: 'OFFICE',
        latitude: 21.17024,
        longitude: 72.831061,
        accuracy: 5,
      });

      setScanResult({
        success: true,
        name: employeeName,
        empCode: targetEmpCode,
        punchTime: serverNow,
        punchType: selectedPunchType === 'IN' ? 'CHECK IN' : 'CHECK OUT',
      });

      setTimeout(() => {
        setScanResult(null);
      }, 4000);
    }, 1500);
  };

  const handleExitKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAuthorized = await apiService.verifyKioskPin(pinInput);
    if (isAuthorized) {
      setActiveTab('home');
      showToast('Exited Kiosk Mode.', 'info');
      setPinInput('');
      setPinPrompt(false);
    } else {
      showToast('Unauthorized: Incorrect Kiosk Admin PIN.', 'error');
    }
  };

  return (
    <div className="min-h-[85vh] bg-black text-white flex flex-col justify-between p-4 rounded-3xl relative overflow-hidden border border-[#243456]">
      {/* Kiosk Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
            L
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">LogiBrisk HQ Kiosk</h2>
            <span className="text-[10px] text-cyan-400 font-mono">Surat Entrance Gate 1</span>
          </div>
        </div>

        {/* Live IST clock */}
        <div className="text-right font-mono">
          <div className="text-sm font-bold text-emerald-400">{liveServerTime.time}</div>
          <span className="text-[10px] text-slate-400">{liveServerTime.date}</span>
        </div>

        {/* Exit PIN button */}
        <button
          onClick={() => setPinPrompt(true)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300"
          title="Admin Settings / Exit Kiosk"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>

      {/* Demo Only / Production Notice */}
      <div className="z-10 my-2">
        {isDemoMode ? (
          <div className="bg-amber-950/70 border border-amber-600/60 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold tracking-wide uppercase text-[10px]">
                Demo Only Simulation
              </span>
            </div>
            <span className="text-[10px] text-amber-300/80">VITE_DEMO_MODE=true</span>
          </div>
        ) : (
          <div className="bg-rose-950/70 border border-rose-600/60 rounded-xl px-3 py-2 flex items-start gap-2 text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[11px]">Face-Scan Simulation Disabled in Production</p>
              <p className="text-[10px] text-rose-300/80 mt-0.5">
                Dedicated terminal hardware with biometric liveness check required. Enable <code className="font-mono bg-black/40 px-1 rounded">VITE_DEMO_MODE=true</code> to test simulated flows.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Viewfinder / Scanner Section */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 relative z-10">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-2 border-dashed border-cyan-500/60 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm shadow-2xl">
          {/* Corner frame markers */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />

          {/* Scanner laser animation when active */}
          {isScanning && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-lg shadow-cyan-500/50" />
          )}

          {scanResult ? (
            <div className="text-center p-4 space-y-2 animate-in zoom-in duration-200">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">{scanResult.name}</h3>
                <span className="text-xs text-cyan-300 font-mono block">{scanResult.empCode}</span>
              </div>
              <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl px-3 py-1 font-mono text-xs text-emerald-200 inline-block">
                {scanResult.punchType} @ {scanResult.punchTime}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {isScanning ? 'Verifying facial liveness...' : 'Position face inside the frame'}
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Target: <span className="font-mono text-cyan-300">{targetEmpCode}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Punch Type Selector */}
        <div className="flex items-center gap-2 mt-4 bg-slate-900 border border-[#243456] rounded-xl p-1">
          <button
            onClick={() => setSelectedPunchType('IN')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPunchType === 'IN'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Check In
          </button>
          <button
            onClick={() => setSelectedPunchType('OUT')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPunchType === 'OUT'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Check Out
          </button>
        </div>

        {/* Scan Trigger Button */}
        <div className="mt-4">
          <button
            onClick={triggerFaceRecognitionPunch}
            disabled={isScanning || !isDemoMode}
            className={`px-8 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xl transition-all ${
              !isDemoMode
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : isScanning
                ? 'bg-cyan-700 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>{isScanning ? 'Scanning...' : 'Trigger Face Scan (Demo)'}</span>
          </button>
        </div>
      </div>

      {/* Admin PIN Exit Modal */}
      {pinPrompt && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white text-center">Enter Kiosk Admin PIN</h3>
            <p className="text-[11px] text-slate-400 text-center">
              Enter authorized administrator PIN to exit kiosk mode.
            </p>

            <form onSubmit={handleExitKiosk} className="space-y-3">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Admin PIN"
                autoFocus
                required
                className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-4 py-2.5 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPinPrompt(false)}
                  className="py-2 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Exit Kiosk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
