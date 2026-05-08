import type { DualPickerDatum } from './datum';
import type { DualPickerMode, DualPickerModeOptions } from '../types';
import { maybeApplyStep, sortUniqueNumbers } from './rangeUtils';

function buildDayList(from: number, to: number): number[] {
  const a = Math.max(1, Math.min(31, Math.floor(from)));
  const b = Math.max(1, Math.min(31, Math.floor(to)));
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

function intRange(from: number, to: number): number[] {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  if (hi - lo > 50000)
    throw new RangeError('[DualPicker] Range too large for year/decade list.');
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
}

function fracDigits(step: number): number {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

function decimalList(from: number, to: number, step: number): number[] {
  if (!Number.isFinite(from + to + step) || step <= 0) return [from];
  const decimals = fracDigits(step);
  const out: number[] = [];
  const maxIter = Math.min(50000, Math.ceil((to - from) / step) + 2);
  let n = 0;
  while (n <= maxIter) {
    let x = from + n * step;
    if (decimals > 0) x = Number(x.toFixed(decimals));
    if (x > to + 1e-9) break;
    out.push(x);
    n++;
  }
  if (out.length === 0) out.push(Number(from.toFixed(decimals)));
  /** uniq + ascending */
  const set = Array.from(new Set(out)).sort((a, b) => a - b);
  return set;
}

function monthLabels(
  style: NonNullable<DualPickerModeOptions['monthStyle']>,
  locale: string | undefined
): DualPickerDatum[] {
  const loc = locale ?? 'default';
  if (style === 'number') return intRange(1, 12);
  try {
    const opts: Intl.DateTimeFormatOptions = {
      month: style === 'short' ? 'short' : 'long',
    };
    const fmt = new Intl.DateTimeFormat(loc, opts);
    return Array.from({ length: 12 }, (_, m) =>
      fmt.format(new Date(Date.UTC(2001, m, 1)))
    );
  } catch {
    /** Fallback — English short */
    const monthsShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthsLong = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return (style === 'short' ? monthsShort : monthsLong).slice();
  }
}

function weekdayDatesInOrder(firstDay: 0 | 1 | undefined): Date[] {
  /** Jan 2025: Sunday UTC ≈ Jan 5 */
  const sun = new Date(Date.UTC(2025, 0, 5));
  const dayMs = 86400000;
  const week = Array.from(
    { length: 7 },
    (_, i) => new Date(sun.getTime() + i * dayMs)
  );
  const sunday = week[0]!;
  return firstDay === 1 ? [...week.slice(1), sunday] : week;
}

function buildWeekdayList(o: DualPickerModeOptions): DualPickerDatum[] {
  const style = o.weekdayStyle ?? 'number';
  const first = o.weekdayFirstDay;

  if (style === 'number') {
    return first === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  }

  const loc = o.weekdayLocale ?? 'default';
  const intlWd: NonNullable<Intl.DateTimeFormatOptions['weekday']> =
    style === 'long' ? 'long' : style === 'narrow' ? 'narrow' : 'short';

  const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const long = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  try {
    const fmt = new Intl.DateTimeFormat(loc, { weekday: intlWd });
    return weekdayDatesInOrder(first).map((d) => fmt.format(d));
  } catch {
    const arr = style === 'long' ? long : short;
    const order =
      first === 1
        ? ([1, 2, 3, 4, 5, 6, 0] as const)
        : ([0, 1, 2, 3, 4, 5, 6] as const);
    return order.map((j) => arr[j]!);
  }
}

/**
 * Computes ordered wheel entries for preset `mode`. `range`/`dual` use caller `data` (numbers).
 */
export function resolveModeSorted(
  mode: DualPickerMode,
  rawData: readonly DualPickerDatum[] | undefined,
  step: number | undefined,
  options: DualPickerModeOptions | undefined
): DualPickerDatum[] {
  const o = options ?? {};

  if (mode === 'range' || mode === 'dual') {
    const d = rawData ?? [];
    const nums: number[] = [];
    for (const v of d) {
      if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
    }
    if (nums.length === 0) {
      throw new RangeError(
        '[DualPicker] `mode="range"` requires numeric `data`.'
      );
    }
    return maybeApplyStep(sortUniqueNumbers(nums), step);
  }

  switch (mode) {
    case 'day':
      return buildDayList(o.dayFrom ?? 1, o.dayTo ?? 31);
    case 'month':
      return monthLabels(o.monthStyle ?? 'number', o.monthLocale);
    case 'year': {
      const y0 = Math.floor(o.yearFrom ?? new Date().getUTCFullYear() - 50);
      const y1 = Math.floor(o.yearTo ?? new Date().getUTCFullYear() + 10);
      return intRange(y0, y1);
    }
    case 'weekday':
      return buildWeekdayList(o);
    case 'alphabet': {
      const upper = !!o.alphabetUpperCase;
      const chars = upper
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        : 'abcdefghijklmnopqrstuvwxyz';
      return [...chars];
    }
    case 'decimal': {
      const from = o.decimalFrom ?? 0;
      const to = o.decimalTo ?? 1;
      const s = o.decimalStep ?? 0.05;
      return decimalList(from, to, s);
    }
    default:
      throw new RangeError(`[DualPicker] Unknown mode "${String(mode)}".`);
  }
}

export function inferGapBasis(sorted: DualPickerDatum[]): 'value' | 'index' {
  if (sorted.some((x) => typeof x === 'string')) return 'index';
  return 'value';
}
