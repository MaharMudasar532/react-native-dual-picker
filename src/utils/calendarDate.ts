import type { CalendarDateParts, DualPickerCalendarRange } from '../types';

export function utcTimestamp(p: CalendarDateParts): number {
  return Date.UTC(p.year, p.month - 1, p.day);
}

export function daysInMonth(year: number, month: number): number {
  const m = Math.min(12, Math.max(1, Math.floor(month)));
  const y = Math.floor(year);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function clampDateParts(p: CalendarDateParts): CalendarDateParts {
  const month = Math.min(12, Math.max(1, Math.floor(p.month)));
  const year = Math.floor(p.year);
  const dim = daysInMonth(year, month);
  const day = Math.min(dim, Math.max(1, Math.floor(p.day)));
  return { year, month, day };
}

export function clampPartsToYearRange(
  p: CalendarDateParts,
  yearFrom: number,
  yearTo: number
): CalendarDateParts {
  const yi = Math.min(yearTo, Math.max(yearFrom, Math.floor(p.year)));
  return clampDateParts({ ...p, year: yi });
}

export function diffUtcCalendarDays(
  a: CalendarDateParts,
  b: CalendarDateParts
): number {
  const ms = utcTimestamp(b) - utcTimestamp(a);
  return Math.round(ms / 86400000);
}

export function addCalendarDays(
  p: CalendarDateParts,
  delta: number
): CalendarDateParts {
  const t = utcTimestamp(p) + delta * 86400000;
  const d = new Date(t);
  return clampDateParts({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  });
}

/** End must be at least `minDays` after start (numeric difference in whole UTC days). */
export function repairEndAfterStartChange(
  start: CalendarDateParts,
  end: CalendarDateParts,
  minDays: number,
  maxDays?: number
): CalendarDateParts {
  let e = clampDateParts(end);
  const s = clampDateParts(start);
  let need = minDays;
  if (!Number.isFinite(need) || need < 0) need = 0;
  while (diffUtcCalendarDays(s, e) < need) {
    e = addCalendarDays(e, 1);
  }
  if (maxDays !== undefined && Number.isFinite(maxDays)) {
    while (diffUtcCalendarDays(s, e) > maxDays) {
      e = addCalendarDays(e, -1);
      if (diffUtcCalendarDays(s, e) < need) break;
    }
    if (diffUtcCalendarDays(s, e) < need) {
      e = addCalendarDays(start, need);
    }
  }
  return clampDateParts(e);
}

/** Keep start/end ordered; minimally adjust end upward if inverted. */
export function normalizeCalendarEnds(
  start: CalendarDateParts,
  end: CalendarDateParts
): { start: CalendarDateParts; end: CalendarDateParts } {
  const s = clampDateParts(start);
  let e = clampDateParts(end);
  if (utcTimestamp(e) < utcTimestamp(s)) {
    e = { ...s };
  }
  return { start: s, end: e };
}

export function normalizeExternalCalendarRange(
  next: DualPickerCalendarRange,
  yearFrom: number,
  yearTo: number,
  minDays: number,
  maxDays?: number
): DualPickerCalendarRange {
  let s = clampPartsToYearRange(next.start, yearFrom, yearTo);
  let e = clampPartsToYearRange(next.end, yearFrom, yearTo);
  ({ start: s, end: e } = normalizeCalendarEnds(s, e));
  e = repairEndAfterStartChange(s, e, minDays, maxDays);
  return { start: s, end: e };
}

export function partsEqual(
  a: CalendarDateParts,
  b: CalendarDateParts
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
