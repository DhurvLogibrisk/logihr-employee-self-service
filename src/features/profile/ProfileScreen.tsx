import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GEOFENCE_SITES } from '../../services/geofenceService';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  ShieldCheck,
  Smartphone,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { profile, setActiveTab, openModal, showToast } = useAppStore();

  const handleLogout = () => {
    showToast('Secure session logged out.', 'info');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Header Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-5 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-xl bg-[#18233e] hover:bg-[#243456] text-slate-300 hover:text-white transition-colors"
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="relative inline-block mx-auto mb-3">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-blue-500/40 shadow-xl"
          />
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121a2f]" />
        </div>

        <h1 className="text-lg font-black text-white tracking-tight">
          {profile.name}
        </h1>
        <p className="text-xs font-semibold text-cyan-400 mt-0.5">
          {profile.designation} · {profile.department}
        </p>
        <span className="inline-block mt-2 font-mono text-[11px] font-bold text-slate-300 bg-[#18233e] px-2.5 py-1 rounded-lg border border-[#243456]">
          {profile.empCode}
        </span>
      </div>

      {/* Details Sections */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3.5 shadow-md text-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Employment Information
        </h3>

        <div className="flex items-center justify-between pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-4 h-4 text-blue-400" />
            <span>Reporting Manager:</span>
          </div>
          <span className="font-semibold text-white">{profile.reportingManager}</span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-400">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Base Office:</span>
          </div>
          <span className="font-semibold text-white">{profile.workLocation}</span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Date of Joining:</span>
          </div>
          <span className="font-semibold text-white">{profile.joiningDate}</span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Working Shift:</span>
          </div>
          <span className="font-mono text-slate-200">{profile.shiftHours}</span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Official Email:</span>
          </div>
          <span className="text-slate-200">{profile.email}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>Mobile No:</span>
          </div>
          <span className="font-mono text-slate-200">{profile.phone}</span>
        </div>
      </div>

      {/* Security & Registered Device Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3 shadow-md text-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Bound Security Device
        </h3>

        <div className="flex items-center justify-between bg-[#18233e] p-3 rounded-xl border border-[#243456]/60">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="font-bold text-white">{profile.registeredDeviceModel}</h4>
              <span className="text-[10px] font-mono text-slate-400">
                ID: {profile.registeredDeviceId} · Biometric Active
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Bound
          </span>
        </div>
      </div>

      {/* Quick Navigation to Settings & Kiosk */}
      <div className="space-y-2">
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-blue-400" />
            <span>Preferences & Smart Reminders</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('kiosk')}
          className="w-full bg-[#121a2f] hover:bg-[#18233e] border border-[#243456] rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Office Kiosk Entrance Mode</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-xl p-3.5 flex items-center justify-center gap-2 text-xs font-bold text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
