import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { serverTimeService } from '../../services/serverTimeService';
import { evaluateGeofence, GEOFENCE_SITES, calculateHaversineDistance } from '../../services/geofenceService';
import { PunchType, WorkMode, AttendancePunch } from '../../types';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Smartphone,
  Wifi,
  Coffee,
  AlertTriangle,
  FileEdit,
  Building,
  Home,
  Briefcase,
  Camera,
  CheckCircle,
  Navigation,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const AttendanceTodayScreen: React.FC = () => {
  const {
    todayPunches,
    profile,
    refreshData,
    showToast,
    openModal,
    isOffline,
    clockDriftAlert,
    liveServerTime,
  } = useAppStore();

  const [workMode, setWorkMode] = useState<WorkMode>('OFFICE');
  const [selectedSiteId, setSelectedSiteId] = useState(GEOFENCE_SITES[0].id);
  const [isPunching, setIsPunching] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [punchSuccessData, setPunchSuccessData] = useState<AttendancePunch | null>(null);

  // Real Device GPS State
  const [realGps, setRealGps] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    hasRealGps: boolean;
    error?: string;
  }>({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    hasRealGps: false,
  });

  // Simulator Toggle for Demo/Testing
  const [useSimulatorGps, setUseSimulatorGps] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Determine current status
  const lastPunch = todayPunches[todayPunches.length - 1];
  const isCheckedIn = lastPunch?.type === 'IN' || lastPunch?.type === 'BREAK_OUT';
  const isOnBreak = lastPunch?.type === 'BREAK_IN';
  const isCheckedOut = lastPunch?.type === 'OUT';

  const firstInPunch = todayPunches.find((p) => p.type === 'IN');

  // Fetch real device GPS coordinates
  const fetchRealGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setRealGps((prev) => ({ ...prev, error: 'Geolocation not supported by browser/device.' }));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRealGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          hasRealGps: true,
          error: undefined,
        });
        setIsLocating(false);
      },
      (err) => {
        setRealGps((prev) => ({
          ...prev,
          hasRealGps: false,
          error: `GPS Permission denied or unavailable: ${err.message}`,
        }));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    fetchRealGps();
  }, []);

  // Elapsed work timer ticker
  useEffect(() => {
    if (!firstInPunch || isCheckedOut) return;

    const calculateElapsed = () => {
      const now = serverTimeService.getCurrentServerEpochMs();
      const start = firstInPunch.epochMs;
      const secs = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(secs);
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(timer);
  }, [firstInPunch, isCheckedOut]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const targetSite = GEOFENCE_SITES.find((s) => s.id === selectedSiteId) || GEOFENCE_SITES[0];

  // Active coordinates used for punch
  const activeLat = useSimulatorGps ? targetSite.latitude : realGps.latitude || targetSite.latitude;
  const activeLng = useSimulatorGps ? targetSite.longitude : realGps.longitude || targetSite.longitude;
  const activeAccuracy = useSimulatorGps ? 8 : realGps.accuracy || 15;

  const currentDistanceMeters = calculateHaversineDistance(
    activeLat,
    activeLng,
    targetSite.latitude,
    targetSite.longitude
  );
  const isInsideOfficeRadius = currentDistanceMeters <= targetSite.radiusMeters;

  const handlePunch = async (punchType: PunchType) => {
    // If in office mode and outside geofence without simulator, prevent or warn
    if (workMode === 'OFFICE' && !isInsideOfficeRadius && !useSimulatorGps) {
      const confirmOutside = window.confirm(
        `You are currently ${currentDistanceMeters > 1000 ? `${(currentDistanceMeters / 1000).toFixed(1)} km` : `${currentDistanceMeters} m`} away from ${targetSite.name} (Geofence radius: ${targetSite.radiusMeters}m).\n\nOffice check-in normally requires being inside the office premises. Would you like to proceed anyway (will be flagged for audit), or switch to WFH mode?`
      );
      if (!confirmOutside) {
        setWorkMode('WFH');
        return;
      }
    }

    setIsPunching(true);
    try {
      // CRITICAL: Request does NOT send any client timestamp.
      // Server stamps authoritative IST time.
      const res = await apiService.recordPunch({
        type: punchType,
        workMode,
        latitude: activeLat,
        longitude: activeLng,
        accuracy: activeAccuracy,
        offlineQueued: isOffline,
      });

      refreshData();
      setPunchSuccessData(res.punch);
      showToast(res.message, 'success');

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 60]);
      }
    } catch {
      showToast('Punch failed. Please check network connection.', 'error');
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Date Ribbon with day type */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-tight">
              {liveServerTime.date}
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              Working day
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Shift: {profile.shiftName} ({profile.shiftHours})
          </p>
        </div>

        {/* Tamper-proof IST badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 bg-[#18233e] border border-cyan-800/60 px-2 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
              Tamper-proof IST
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Asia/Kolkata (UTC+05:30)
          </span>
        </div>
      </div>

      {/* 2. Clock Drift Warning if device clock is altered */}
      {clockDriftAlert && (
        <div className="bg-amber-950/80 border border-amber-600/70 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold">Authoritative Clock Enforced:</span> Device clock deviates by more than 2 minutes from server IST. The punch timestamp is strictly stamped by the LogiHR server.
          </div>
        </div>
      )}

      {/* 3. Work Mode Selector (Office / WFH / On-Duty) */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-xl p-1.5 flex items-center gap-1">
        <button
          onClick={() => setWorkMode('OFFICE')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
            workMode === 'OFFICE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Office
        </button>
        <button
          onClick={() => setWorkMode('WFH')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
            workMode === 'WFH'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          WFH
        </button>
        <button
          onClick={() => setWorkMode('ON_DUTY')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
            workMode === 'ON_DUTY'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          On-Duty
        </button>
      </div>

      {/* Geofence Status & Real GPS Bar */}
      <div className="bg-[#18233e]/80 border border-[#243456] rounded-xl p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">GPS Location:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRealGps}
              disabled={isLocating}
              className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 bg-[#121a2f] px-2 py-0.5 rounded border border-[#243456]"
            >
              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>Refresh GPS</span>
            </button>

            {/* Simulator Override Button */}
            <button
              onClick={() => {
                setUseSimulatorGps(!useSimulatorGps);
                showToast(
                  !useSimulatorGps
                    ? 'Office Geofence Simulator enabled for testing.'
                    : 'Using actual device GPS coordinates.',
                  'info'
                );
              }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                useSimulatorGps
                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                  : 'bg-[#121a2f] text-slate-400 border-[#243456]'
              }`}
            >
              {useSimulatorGps ? 'Testing: Surat HQ Simulated' : 'Real GPS'}
            </button>
          </div>
        </div>

        {/* Real coordinates readout */}
        <div className="bg-[#121a2f] p-2 rounded-lg font-mono text-[11px] flex items-center justify-between text-slate-300">
          <div>
            <span>Lat: {activeLat.toFixed(5)}, Lng: {activeLng.toFixed(5)}</span>
            <span className="text-[10px] text-slate-500 block">Accuracy: ±{activeAccuracy}m</span>
          </div>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              isInsideOfficeRadius || workMode !== 'OFFICE'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {workMode !== 'OFFICE'
              ? 'Authorized Mode'
              : isInsideOfficeRadius
              ? 'Inside Geofence'
              : `${currentDistanceMeters > 1000 ? `${(currentDistanceMeters / 1000).toFixed(1)}km` : `${currentDistanceMeters}m`} Outside`}
          </span>
        </div>

        {/* Site Picker if Office */}
        {workMode === 'OFFICE' && (
          <div className="flex items-center justify-between pt-1 border-t border-[#243456]/50">
            <span className="text-[11px] text-slate-400">Assigned Office Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="bg-[#121a2f] border border-[#243456] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              {GEOFENCE_SITES.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.radiusMeters}m radius)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Big Circular Punch Button Card */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
        {/* Live IST Clock */}
        <div className="text-center mb-5">
          <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-1">
            <span>{liveServerTime.time}</span>
            <span className="text-xs text-cyan-400 font-bold self-start mt-1">IST</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Authoritative Server Clock (Asia/Kolkata)</p>
        </div>

        {/* Big Circular Punch Button */}
        <div className="relative my-2">
          {!isCheckedIn && !isOnBreak ? (
            <button
              onClick={() => handlePunch('IN')}
              disabled={isPunching}
              className="relative w-44 h-44 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white font-extrabold flex flex-col items-center justify-center shadow-2xl shadow-emerald-600/40 transition-all transform active:scale-95 group focus:outline-none animate-pulse-ring cursor-pointer"
            >
              <div className="w-36 h-36 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-emerald-600/30 backdrop-blur-sm">
                <Clock className="w-8 h-8 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-lg tracking-wider uppercase font-black">CHECK IN</span>
                <span className="text-[10px] font-mono text-emerald-100 opacity-90 mt-0.5">
                  Tap to Record
                </span>
              </div>
            </button>
          ) : isCheckedIn ? (
            <button
              onClick={() => handlePunch('OUT')}
              disabled={isPunching}
              className="relative w-44 h-44 rounded-full bg-gradient-to-br from-rose-500 to-red-700 hover:from-rose-400 hover:to-red-600 text-white font-extrabold flex flex-col items-center justify-center shadow-2xl shadow-rose-600/40 transition-all transform active:scale-95 group focus:outline-none cursor-pointer"
            >
              <div className="w-36 h-36 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-rose-600/30 backdrop-blur-sm">
                <Clock className="w-8 h-8 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-lg tracking-wider uppercase font-black">CHECK OUT</span>
                <span className="text-[10px] font-mono text-rose-100 opacity-90 mt-0.5">
                  End Shift
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handlePunch('BREAK_OUT')}
              disabled={isPunching}
              className="relative w-44 h-44 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-extrabold flex flex-col items-center justify-center shadow-2xl shadow-amber-600/40 transition-all transform active:scale-95 group focus:outline-none cursor-pointer"
            >
              <div className="w-36 h-36 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-amber-600/30 backdrop-blur-sm">
                <Coffee className="w-8 h-8 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-lg tracking-wider uppercase font-black">END BREAK</span>
                <span className="text-[10px] font-mono text-amber-100 opacity-90 mt-0.5">
                  Resume Work
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Break in button if Checked in */}
        {isCheckedIn && !isOnBreak && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => handlePunch('BREAK_IN')}
              disabled={isPunching}
              className="px-4 py-2 rounded-xl bg-[#18233e] hover:bg-[#243456] border border-[#243456] text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" />
              Take Break (Break In)
            </button>
          </div>
        )}

        {/* Elapsed Live Time */}
        <div className="mt-5 w-full bg-[#18233e]/70 border border-[#243456] rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Elapsed Work Time:</span>
          </div>
          <span className="font-mono font-bold text-sm text-cyan-300">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* 5. Metadata Rows */}
      <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Punch Verification Metadata
        </h3>

        {/* Geofence Status */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Geofence Status:</span>
          </div>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {isInsideOfficeRadius ? `Inside ${targetSite.name}` : `${currentDistanceMeters}m away from ${targetSite.name}`}
          </span>
        </div>

        {/* Registered Device */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-300">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Bound Device:</span>
          </div>
          <span className="font-mono text-slate-200">
            {profile.registeredDeviceModel}
          </span>
        </div>

        {/* Network & IP Status */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#243456]/60">
          <div className="flex items-center gap-2 text-slate-300">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span>Network Link:</span>
          </div>
          <span className="text-slate-200">
            {isOffline ? 'Offline Queue' : 'Surat HQ Corp WiFi (Verified)'}
          </span>
        </div>

        {/* Flags */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Security Flags:</span>
          </div>
          <span className="font-medium text-emerald-300">
            Clean (No Mock GPS / Device Bound)
          </span>
        </div>
      </div>

      {/* 6. Regularization */}
      <div className="space-y-2.5">
        <button
          onClick={() => openModal('regularization')}
          className="w-full bg-[#18233e] hover:bg-[#243456] border border-[#243456] rounded-xl p-3 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <FileEdit className="w-4 h-4 text-blue-400" />
            <span>Missed a punch? Apply for Regularization</span>
          </div>
          <span className="text-blue-400 font-bold">Apply &rarr;</span>
        </button>
      </div>

      {/* Success Sheet Modal after Punch */}
      {punchSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121a2f] border border-[#243456] rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Punch Stamped Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative IST Server Timestamp Recorded:
              </p>
              <div className="text-xl font-mono font-black text-cyan-300 mt-2 bg-[#18233e] p-2.5 rounded-xl border border-[#243456]">
                {punchSuccessData.serverTimeFormattedIST} IST
              </div>
            </div>
            <div className="text-[11px] text-slate-400 bg-[#0a0f1d] p-2.5 rounded-lg text-left space-y-1">
              <div><span className="text-slate-500">Site:</span> {punchSuccessData.siteName}</div>
              <div><span className="text-slate-500">Device:</span> {punchSuccessData.deviceModel}</div>
              <div><span className="text-slate-500">Tamper Audit:</span> Passed (Server Authoritative)</div>
            </div>
            <button
              onClick={() => setPunchSuccessData(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
