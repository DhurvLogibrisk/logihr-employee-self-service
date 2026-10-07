/**
 * Production Calculation Engine for LogiHR
 * Timezone: Asia/Kolkata (IST, UTC+05:30)
 */

/**
 * Calculates working days between two dates, excluding Saturdays and Sundays.
 * Handles half-day requests (returns 0.5).
 */
export function calculateWorkingDays(startDateStr: string, endDateStr: string, isHalfDay = false): number {
  if (isHalfDay) return 0.5;
  if (!startDateStr || !endDateStr) return 0;

  try {
    const parseDatePart = (str: string) => {
      const [dPart] = str.split(' ');
      const [d, m, y] = dPart.split('/').map(Number);
      return new Date(y, m - 1, d);
    };

    const start = parseDatePart(startDateStr);
    const end = parseDatePart(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return 0;
    }

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay(); // 0 = Sun, 6 = Sat
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Parses time string (e.g. "09:30 AM" or "18:30") to minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = Number(match[1]);
  const m = Number(match[2]);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

/**
 * Checks if check-in time exceeds shift start time (default: 09:30 AM IST).
 */
export function checkIsLate(inTimeStr: string, shiftStartStr = '09:30 AM'): boolean {
  const inMins = parseTimeToMinutes(inTimeStr);
  const shiftMins = parseTimeToMinutes(shiftStartStr);
  return inMins > shiftMins;
}

/**
 * Computes net work minutes between check-in and check-out, deducting break minutes.
 */
export function calculateNetWorkMinutes(inTimeStr: string, outTimeStr: string, breakMinutes = 45): number {
  const inMins = parseTimeToMinutes(inTimeStr);
  const outMins = parseTimeToMinutes(outTimeStr);
  const gross = Math.max(0, outMins - inMins);
  return Math.max(0, gross - breakMinutes);
}

/**
 * Validates timesheet rows for intersecting time ranges.
 */
export function checkTimesheetOverlap(rows: { start: string; end: string }[]): boolean {
  for (let i = 0; i < rows.length; i++) {
    const start1 = parseTimeToMinutes(rows[i].start);
    const end1 = parseTimeToMinutes(rows[i].end);

    for (let j = i + 1; j < rows.length; j++) {
      const start2 = parseTimeToMinutes(rows[j].start);
      const end2 = parseTimeToMinutes(rows[j].end);

      if (start1 < end2 && end1 > start2) {
        return true; // Overlap detected
      }
    }
  }
  return false;
}
