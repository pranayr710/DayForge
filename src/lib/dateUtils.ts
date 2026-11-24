export interface ZonedNowParts {
  dateKey: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun ... 6 = Sat
  minutesFromMidnight: number;
  hour: number;
  minute: number;
  formattedTime: string;
  formattedDate: string;
  dayName: string;
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getNowParts(timezone = 'Asia/Kolkata', now = new Date()): ZonedNowParts {
  const partsFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = partsFmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const weekdayShort = get('weekday');
  const rawHour = Number(get('hour'));
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(get('minute'));

  const dayOfWeek = WEEKDAY_MAP[weekdayShort] ?? now.getDay();
  const dateKey = `${year}-${month}-${day}`;
  const minutesFromMidnight = hour * 60 + minute;

  const timeFmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateFmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    dateKey,
    dayOfWeek,
    minutesFromMidnight,
    hour,
    minute,
    formattedTime: timeFmt.format(now),
    formattedDate: dateFmt.format(now),
    dayName: DAY_NAMES[dayOfWeek] ?? 'Monday',
  };
}

export function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function parseTimeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr ?? 0);
  const m = Number(mStr ?? 0);
  return h * 60 + m;
}

export function formatTime24To12(hhmm: string): string {
  const mins = parseTimeToMinutes(hhmm);
  return formatMinutesTo12(mins);
}

export function formatMinutesTo12(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatDurationMinutes(totalMins: number): string {
  const mins = Math.max(0, Math.round(totalMins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
}

export function utcDateToDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = dateKeyToUtcDate(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateToDateKey(d);
}

export function getDayOfWeekFromDateKey(dateKey: string): number {
  return dateKeyToUtcDate(dateKey).getUTCDay();
}

/**
 * Converts a stored ISO timestamp (UTC) into the YYYY-MM-DD dateKey as seen in
 * the given timezone. Prevents events after midnight UTC from being attributed
 * to the wrong local day (e.g. 02:00 IST → correct IST date, not the UTC date).
 */
export function getDateKeyFromIso(iso: string, timezone = 'Asia/Kolkata'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return getNowParts(timezone, d).dateKey;
}

/** Shifts a dateKey by whole calendar months, clamping the day to month length. */
export function shiftMonthDateKey(dateKey: string, deltaMonths: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const base = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1 + deltaMonths, 1));
  const year = base.getUTCFullYear();
  const monthIdx = base.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const day = Math.min(d ?? 1, daysInMonth);
  return utcDateToDateKey(new Date(Date.UTC(year, monthIdx, day)));
}

export function getWeekDateKeys(
  anchorDateKey: string,
  weekStartsOn: 'monday' | 'sunday' = 'monday'
): string[] {
  const dow = getDayOfWeekFromDateKey(anchorDateKey);
  const offset =
    weekStartsOn === 'monday' ? (dow === 0 ? -6 : 1 - dow) : -dow;
  const startKey = addDaysToDateKey(anchorDateKey, offset);
  return Array.from({ length: 7 }, (_, i) => addDaysToDateKey(startKey, i));
}

export function getMonthCalendarDateKeys(year: number, monthIndex0: number, weekStartsOn: 'monday' | 'sunday' = 'monday'): string[] {
  const firstDay = new Date(Date.UTC(year, monthIndex0, 1));
  const firstDow = firstDay.getUTCDay();
  const lead = weekStartsOn === 'monday' ? (firstDow === 0 ? 6 : firstDow - 1) : firstDow;
  const gridStart = new Date(Date.UTC(year, monthIndex0, 1 - lead));
  return Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + idx);
    return utcDateToDateKey(d);
  });
}

export function formatShortDateLabel(dateKey: string): string {
  const d = dateKeyToUtcDate(dateKey);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

export function getShortDayLabel(dateKey: string): string {
  const dow = getDayOfWeekFromDateKey(dateKey);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow] ?? '';
}

export function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  const a = dateKeyToUtcDate(fromKey).getTime();
  const b = dateKeyToUtcDate(toKey).getTime();
  return Math.round((b - a) / 86400000);
}
