import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  evaluateGeofence,
  GEOFENCE_SITES,
} from '../services/geofenceService';
import {
  calculateWorkingDays,
  checkIsLate,
  calculateNetWorkMinutes,
  checkTimesheetOverlap,
  parseTimeToMinutes,
} from '../services/attendanceCalculations';

/**
 * 1. Haversine & Geofence Unit Tests (Calls real geofenceService)
 */
describe('Geofence & Haversine Distance Engine', () => {
  const suratHQ = GEOFENCE_SITES[0];

  it('calculates exactly 0 meters distance when coordinates are identical', () => {
    const dist = calculateHaversineDistance(
      suratHQ.latitude,
      suratHQ.longitude,
      suratHQ.latitude,
      suratHQ.longitude
    );
    expect(dist).toBe(0);
  });

  it('evaluates point within 250m radius as inside geofence', () => {
    const lat50m = suratHQ.latitude + 0.00045; // ~50m north
    const dist = calculateHaversineDistance(
      suratHQ.latitude,
      suratHQ.longitude,
      lat50m,
      suratHQ.longitude
    );
    expect(dist).toBeLessThan(suratHQ.radiusMeters);

    const evaluation = evaluateGeofence(lat50m, suratHQ.longitude, 10);
    expect(evaluation.isWithinGeofence).toBe(true);
    expect(evaluation.nearestSite.id).toBe(suratHQ.id);
  });

  it('rejects coordinates 20km away as outside geofence', () => {
    const distantLat = suratHQ.latitude + 0.2;
    const distantLng = suratHQ.longitude + 0.2;
    const evaluation = evaluateGeofence(distantLat, distantLng, 10);
    expect(evaluation.isWithinGeofence).toBe(false);
    expect(evaluation.distanceMeters).toBeGreaterThan(15000);
  });
});

/**
 * 2. Leave Working Day Calculator Tests (Calls real attendanceCalculations)
 */
describe('Leave Working Day Calculator Rules', () => {
  it('computes exact 3 working days for Monday to Wednesday span', () => {
    const days = calculateWorkingDays('12/10/2026', '14/10/2026');
    expect(days).toBe(3);
  });

  it('skips Saturday and Sunday in Friday to Monday span (2 working days)', () => {
    const days = calculateWorkingDays('09/10/2026', '12/10/2026');
    expect(days).toBe(2);
  });

  it('returns exactly 0.5 days when isHalfDay flag is true', () => {
    const days = calculateWorkingDays('12/10/2026', '12/10/2026', true);
    expect(days).toBe(0.5);
  });

  it('excludes both weekend days on a full Monday-Sunday week (5 working days)', () => {
    const days = calculateWorkingDays('05/10/2026', '11/10/2026');
    expect(days).toBe(5);
  });
});

/**
 * 3. Work-Minutes & Shift Timing Tests (Calls real attendanceCalculations)
 */
describe('Work Minutes & Shift Calculation Rules', () => {
  it('detects on-time arrival before shift start (09:25 AM vs 09:30 AM)', () => {
    expect(checkIsLate('09:25 AM', '09:30 AM')).toBe(false);
  });

  it('flags late mark when check-in is after shift start (09:42 AM vs 09:30 AM)', () => {
    expect(checkIsLate('09:42 AM', '09:30 AM')).toBe(true);
  });

  it('calculates gross and net work minutes with break deduction', () => {
    // 09:30 AM to 06:30 PM = 540 mins gross; minus 45 mins break = 495 mins net
    const netMins = calculateNetWorkMinutes('09:30 AM', '06:30 PM', 45);
    expect(netMins).toBe(495);
  });

  it('converts 12-hour and 24-hour time formats accurately to minutes from midnight', () => {
    expect(parseTimeToMinutes('09:30 AM')).toBe(570);
    expect(parseTimeToMinutes('01:30 PM')).toBe(810);
    expect(parseTimeToMinutes('18:30')).toBe(1110);
  });
});

/**
 * 4. Timesheet Overlap Validator Tests (Calls real attendanceCalculations)
 */
describe('Timesheet Overlap Validator Rules', () => {
  it('passes non-overlapping consecutive rows', () => {
    const rows = [
      { start: '09:30', end: '13:00' },
      { start: '14:00', end: '18:30' },
    ];
    expect(checkTimesheetOverlap(rows)).toBe(false);
  });

  it('detects overlapping time intervals', () => {
    const rows = [
      { start: '09:30', end: '13:00' },
      { start: '12:30', end: '15:00' }, // 12:30 is before previous end 13:00
    ];
    expect(checkTimesheetOverlap(rows)).toBe(true);
  });
});
