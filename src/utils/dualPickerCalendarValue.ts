import type {
  CalendarDateParts,
  CalendarDatePartsInput,
  DualPickerCalendarRange,
  DualPickerCalendarRangeInput,
  DualPickerModeOptions,
} from '../types';
import {
  clampDateParts,
  clampPartsToYearRange,
  normalizeExternalCalendarRange,
} from './calendarDate';

export function calendarYearBoundsFromOptions(
  modeOptions?: DualPickerModeOptions
): { years: number[]; yMin: number; yMax: number } {
  const y0 = Math.floor(
    modeOptions?.yearFrom ?? new Date().getUTCFullYear() - 50
  );
  const y1 = Math.floor(
    modeOptions?.yearTo ?? new Date().getUTCFullYear() + 10
  );
  const lo = Math.min(y0, y1);
  const hi = Math.max(y0, y1);
  const years = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const yMin = years[0] ?? new Date().getUTCFullYear();
  const yMax = years[years.length - 1] ?? yMin;
  return { years, yMin, yMax };
}

/** Current local calendar date (y/m/d), clamped to a valid civil date. */
export function nowLocalCalendarParts(): CalendarDateParts {
  const d = new Date();
  return clampDateParts({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
}

function finiteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function pickField(
  explicit: unknown,
  optionDefault: number | undefined,
  nowVal: number
): number {
  if (finiteNum(explicit)) return explicit;
  if (finiteNum(optionDefault)) return optionDefault;
  return nowVal;
}

/**
 * Resolve partial calendar halves (`value` omitting y/m/d) using
 * [`defaultCalendar*`](/DualPickerModeOptions) from `modeOptions`, then device's local date.
 */
export function resolveDualPickerCalendarInput(
  raw: DualPickerCalendarRange | DualPickerCalendarRangeInput,
  modeOptions: DualPickerModeOptions | undefined,
  yMin: number,
  yMax: number
): DualPickerCalendarRange {
  const now = nowLocalCalendarParts();
  const o = modeOptions ?? {};

  function half(inp: CalendarDatePartsInput): CalendarDateParts {
    const y = pickField(inp.year, o.defaultCalendarYear, now.year);
    const m = pickField(inp.month, o.defaultCalendarMonth, now.month);
    const day = pickField(inp.day, o.defaultCalendarDay, now.day);
    return clampPartsToYearRange(
      clampDateParts({ year: y, month: m, day }),
      yMin,
      yMax
    );
  }

  const r = raw as DualPickerCalendarRangeInput;
  const startObj =
    typeof r.start === 'object' && r.start !== null ? r.start : {};
  const endObj = typeof r.end === 'object' && r.end !== null ? r.end : {};
  return { start: half(startObj), end: half(endObj) };
}

/**
 * Full canonical range for `mode="date"`: resolve partial halves, clamp to configured year bounds,
 * then apply min/max gap rules (unless `enforceRangeGap` is `false`).
 */
export function normalizeDualPickerCalendarValue(
  value: DualPickerCalendarRange | DualPickerCalendarRangeInput,
  modeOptions: DualPickerModeOptions | undefined,
  minGap: number,
  maxGap?: number,
  enforceRangeGap = true
): DualPickerCalendarRange {
  const { yMin, yMax } = calendarYearBoundsFromOptions(modeOptions);
  const resolved = resolveDualPickerCalendarInput(
    value,
    modeOptions,
    yMin,
    yMax
  );
  if (!enforceRangeGap) {
    return resolved;
  }
  return normalizeExternalCalendarRange(resolved, yMin, yMax, minGap, maxGap);
}
