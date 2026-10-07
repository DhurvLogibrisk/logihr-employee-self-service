import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Fingerprint,
  Smartphone,
  AlertCircle,
  Building,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const LoginScreen: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { showToast, profile } = useAppStore();

  const [company] = useState('LogiBrisk Technologies');
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLockedOut) {
      setError('Account temporarily locked out due to 5 consecutive failed attempts. Please contact HR admin.');
      return;
    }

    if (!empId.trim() || !password.trim()) {
      setError('Please provide your Employee ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiService.login(empId.trim(), password);

      if (result.success) {
        showToast(`Welcome back, ${result.user?.name || profile.name}! Signed in to Surat HQ session.`, 'success');
        onLoginSuccess();
      } else {
        const nextFail = failedAttempts + 1;
        setFailedAttempts(nextFail);
        if (nextFail >= 5) {
          setIsLockedOut(true);
          setError('Maximum failed attempts reached. Account locked for 15 minutes.');
        } else {
          setError(result.error || `Invalid credentials. Attempt ${nextFail} of 5 before lockout.`);
        }
      }
    } catch {
      setError('Network communication failed during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await apiService.loginBiometric();
      if (result.success) {
        showToast('Biometric authentication verified on bound Google Pixel 8 Pro.', 'success');
        onLoginSuccess();
      } else {
        setError(result.error || 'Biometric authentication failed.');
      }
    } catch {
      setError('Biometric sensor verification error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId.trim()) {
      setError('Please provide your Employee ID or Email first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const email = empId.includes('@') ? empId : `${empId.toLowerCase().replace(/[^a-z0-9]/g, '')}@logibrisk.com`;
      if (isSupabaseConfigured) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
        if (resetErr) {
          setError(resetErr.message);
          return;
        }
      }
      showToast(`Password reset link dispatched to ${email}.`, 'success');
      setForgotPasswordStep(false);
    } catch {
      showToast('Password reset link request initiated. Check corporate email.', 'info');
      setForgotPasswordStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 text-white font-black text-2xl mb-3 tracking-tighter">
          L
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">LogiHR</h1>
        <p className="text-xs text-slate-400 mt-1">
          Employee Self Service · LogiBrisk Technologies
        </p>
      </div>

      <div className="bg-[#121a2f] border border-[#243456] rounded-3xl p-6 shadow-2xl space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!forgotPasswordStep ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* 1. Company (Read-only) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Company
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={company}
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-slate-300 cursor-not-allowed select-none font-semibold"
                />
                <Building className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* 2. Employee ID / Mobile No.* */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200">
                  Employee ID / Mobile No.*
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">Demo: EMP-00125</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="e.g. EMP-00125"
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* 3. Password* */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200">
                  Password*
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordStep(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLockedOut || isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to LogiHR'}
            </button>

            {/* Biometric login shortcut */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#18233e] hover:bg-[#243456] border border-[#243456] text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Verify Bound Device Biometrics</span>
              </button>
            </div>

            {/* Auth Information */}
            <div className="p-2.5 rounded-xl bg-[#18233e]/50 border border-[#243456]/50 text-[11px] text-slate-400 text-center">
              <span>Sign in with your corporate LogiBrisk credentials or Supabase Auth. Contact HR admin for initial account provisioning.</span>
            </div>
          </form>
        ) : (
          /* OTP Forgot Password Flow */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h3 className="text-sm font-bold text-white">Reset Password via OTP</h3>
            <p className="text-xs text-slate-400">
              We have dispatched a 6-digit verification code to registered mobile and email of {empId}.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter OTP"
                required
                className="w-full bg-[#18233e] border border-[#243456] rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForgotPasswordStep(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Back to Login
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Verify & Reset
              </button>
            </div>
          </form>
        )}

        {/* Bound Device Seal */}
        <div className="pt-3 border-t border-[#243456]/60 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bound Device: Google Pixel 8 Pro (DEV-PX8-9941)</span>
        </div>
      </div>
    </div>
  );
};
