/**
 * Tamper-Proof IST Server Time Service
 *
 * In LogiHR, the device clock is NEVER trusted for attendance punches.
 * The client periodically syncs with authoritative server time (/api/time)
 * and maintains a monotonic offset (serverTimeEpoch - deviceTimeEpoch).
 * Punches NEVER send a client timestamp; the server stamps the time.
 */

class ServerTimeService {
  private offsetMs = 0; // serverEpoch - deviceEpoch
  private isDriftDetected = false;
  private driftDifferenceMinutes = 0;
  private simulatedDriftMinutes = 0; // for testing / verification
  private syncListeners: Set<(isDrift: boolean) => void> = new Set();
  private lastSyncTimestamp = 0;

  constructor() {
    this.syncWithServer();
    // Re-sync every 45 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => this.syncWithServer(), 45000);
    }
  }

  public async syncWithServer(): Promise<{ serverTimeIST: string; driftDetected: boolean }> {
    const deviceBeforeReq = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('/api/time', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const deviceAfterReq = Date.now();
        // Round trip latency estimate (half RTT)
        const latencyMs = Math.round((deviceAfterReq - deviceBeforeReq) / 2);
        const serverEpoch = Number(data.epochMs) + latencyMs;

        // Calculate offset between authoritative server and device clock
        this.offsetMs = serverEpoch - deviceAfterReq;
        this.lastSyncTimestamp = Date.now();

        // Calculate drift: difference between device local clock and true server time
        const realDriftMs = Math.abs(this.offsetMs);
        this.driftDifferenceMinutes = Math.round(realDriftMs / 60000) + this.simulatedDriftMinutes;
        this.isDriftDetected = this.driftDifferenceMinutes >= 2;

        this.notifyListeners();

        return {
          serverTimeIST: this.getCurrentServerTimeFormattedIST(),
          driftDetected: this.isDriftDetected,
        };
      }
    } catch {
      // If server unreachable, maintain existing offset
    }

    this.driftDifferenceMinutes = Math.round(Math.abs(this.offsetMs) / 60000) + this.simulatedDriftMinutes;
    this.isDriftDetected = this.driftDifferenceMinutes >= 2;
    this.notifyListeners();

    return {
      serverTimeIST: this.getCurrentServerTimeFormattedIST(),
      driftDetected: this.isDriftDetected,
    };
  }

  public getCurrentServerEpochMs(): number {
    return Date.now() + this.offsetMs;
  }

  public getCurrentServerTime(): Date {
    return new Date(this.getCurrentServerEpochMs());
  }

  public getCurrentServerTimeFormattedIST(): string {
    const serverDate = this.getCurrentServerTime();
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(serverDate);
  }

  public getLiveTimeDisplayIST(): { time: string; date: string; seconds: string } {
    const serverDate = this.getCurrentServerTime();

    const timeParts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).formatToParts(serverDate);

    const hour = timeParts.find((p) => p.type === 'hour')?.value || '10';
    const minute = timeParts.find((p) => p.type === 'minute')?.value || '00';
    const second = timeParts.find((p) => p.type === 'second')?.value || '00';
    const dayPeriod = timeParts.find((p) => p.type === 'dayPeriod')?.value || 'AM';

    const dateStr = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(serverDate);

    return {
      time: `${hour}:${minute} ${dayPeriod}`,
      date: dateStr,
      seconds: second,
    };
  }

  public isClockDriftActive(): boolean {
    return this.isDriftDetected;
  }

  public getDriftDifferenceMinutes(): number {
    return this.driftDifferenceMinutes;
  }

  public setSimulatedDrift(minutes: number) {
    this.simulatedDriftMinutes = minutes;
    this.isDriftDetected = Math.abs(minutes) >= 2;
    this.notifyListeners();
  }

  public subscribeDriftAlert(callback: (isDrift: boolean) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifyListeners() {
    this.syncListeners.forEach((listener) => listener(this.isDriftDetected));
  }
}

export const serverTimeService = new ServerTimeService();
