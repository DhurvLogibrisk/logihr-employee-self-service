import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/apiService';
import { ShieldCheck, MapPin, Smartphone, Lock, CheckCircle2 } from 'lucide-react';

export const PrivacyConsentModal: React.FC = () => {
  const { profile, refreshData, showToast } = useAppStore();
  const [gpsConsent, setGpsConsent] = useState(true);
  const [deviceConsent, setDeviceConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If consent already given, do not show
  if (profile.consentGivenAt) {
    return null;
  }

  const handleAccept = async () => {
    if (!gpsConsent || !deviceConsent) {
      showToast('Please accept both consent items to activate employee self service.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.recordPrivacyConsent('v1.0');
      refreshData();
      showToast('Privacy consent recorded. Welcome to LogiHR!', 'success');
    } catch {
      showToast('Failed to record consent.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121a2f] border border-[#243456] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Employee Privacy Notice</h2>
            <span className="text-[10px] font-mono text-cyan-400">DPDP Act (India 2023) Compliant</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          LogiBrisk Technologies respects your data privacy. LogiHR collects minimum necessary information strictly for attendance verification and payroll statutory requirements.
        </p>

        {/* Policy Highlights */}
        <div className="space-y-2.5 bg-[#18233e] p-3.5 rounded-2xl border border-[#243456]/60 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">No Background GPS Tracking</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Your GPS coordinates are captured <strong className="text-slate-200">only at the exact moment</strong> you tap &apos;Punch In&apos; or &apos;Punch Out&apos; to verify office geofence distance. Location is never accessed in the background.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-[#243456]/40">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Anti-Proxy Device Binding</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Your account is tied to your primary device ({profile.registeredDeviceModel}) to eliminate buddy punching.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-[#243456]/40">
            <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Authoritative IST Server Timestamping</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Punches are recorded with tamper-proof Asia/Kolkata server time to protect your overtime and late arrival records.
              </p>
            </div>
          </div>
        </div>

        {/* Checkbox agreements */}
        <div className="space-y-2 pt-1 text-xs text-slate-300">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={gpsConsent}
              onChange={(e) => setGpsConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded bg-[#18233e] border-[#243456] text-blue-600 focus:ring-0"
            />
            <span className="text-[11px]">
              I consent to momentary GPS capture during punch actions for office geofence verification.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={deviceConsent}
              onChange={(e) => setDeviceConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded bg-[#18233e] border-[#243456] text-blue-600 focus:ring-0"
            />
            <span className="text-[11px]">
              I consent to device binding for security and authentication audit compliance.
            </span>
          </label>
        </div>

        {/* Consent Action Button */}
        <div className="pt-2">
          <button
            onClick={handleAccept}
            disabled={!gpsConsent || !deviceConsent || isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Recording Consent...' : 'Accept & Activate Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
