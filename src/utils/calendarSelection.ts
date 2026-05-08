import type { CalendarDateParts, DualPickerClampBehavior } from '../types';
import {
  clampDateParts,
  diffUtcCalendarDays,
  normalizeCalendarEnds,
  repairEndAfterStartChange,
  utcTimestamp,
  addCalendarDays,
} from './calendarDate';

function minDaysDefault(minGap?: number): number {
  const g =
    typeof minGap === 'number' && Number.isFinite(minGap) && minGap >= 0
      ? minGap
      : 1;
  return Math.floor(g);
}

function violatesWindow(
  start: CalendarDateParts,
  end: CalendarDateParts,
  minDays: number,
  maxDays?: number
): boolean {
  const diff = diffUtcCalendarDays(start, end);
  if (diff < minDays) return true;
  if (maxDays !== undefined && Number.isFinite(maxDays) && diff > maxDays)
    return true;
  return false;
}

/**
 * User finished adjusting **start** date (whole triple committed per field elsewhere).
 */
export function applyCalendarStartWheel(
  proposedStart: CalendarDateParts,
  currentStart: CalendarDateParts,
  currentEnd: CalendarDateParts,
  minGap?: number,
  maxGap?: number,
  clampBehavior: DualPickerClampBehavior = 'push-end',
  autoShiftEnd = true,
  enforceRangeGap = true
): {
  start: CalendarDateParts;
  end: CalendarDateParts;
  lockReject: boolean;
  constraint?: 'min-gap' | 'max-gap';
} {
  const s0 = clampDateParts(proposedStart);
  if (!enforceRangeGap) {
    return {
      start: s0,
      end: clampDateParts(currentEnd),
      lockReject: false,
      constraint: undefined,
    };
  }

  const minDays = minDaysDefault(minGap);

  if (clampBehavior === 'lock') {
    const trial = normalizeCalendarEnds(s0, clampDateParts(currentEnd));
    if (violatesWindow(trial.start, trial.end, minDays, maxGap ?? undefined)) {
      return {
        start: currentStart,
        end: currentEnd,
        lockReject: true,
      };
    }
    return { start: s0, end: trial.end, lockReject: false };
  }

  if (clampBehavior === 'push-end' && autoShiftEnd) {
    const pair = normalizeCalendarEnds(s0, clampDateParts(currentEnd));
    const nextEnd = repairEndAfterStartChange(
      pair.start,
      pair.end,
      minDays,
      maxGap
    );
    return { start: pair.start, end: nextEnd, lockReject: false };
  }

  const pair = normalizeCalendarEnds(s0, clampDateParts(currentEnd));
  if (!violatesWindow(pair.start, pair.end, minDays, maxGap ?? undefined)) {
    return { start: pair.start, end: pair.end, lockReject: false };
  }
  let s = clampDateParts(pair.start);
  const fixedEnd = pair.end;
  if (utcTimestamp(s) > utcTimestamp(fixedEnd)) {
    s = { ...fixedEnd };
  }
  let guard = 0;
  while (
    violatesWindow(s, fixedEnd, minDays, maxGap ?? undefined) &&
    guard++ < 800
  ) {
    s = addCalendarDays(s, -1);
  }
  return {
    start: clampDateParts(s),
    end: fixedEnd,
    lockReject: false,
    constraint: 'max-gap',
  };
}

export function applyCalendarEndWheel(
  proposedEnd: CalendarDateParts,
  currentStart: CalendarDateParts,
  currentEnd: CalendarDateParts,
  minGap?: number,
  maxGap?: number,
  clampBehavior: DualPickerClampBehavior = 'push-end',
  enforceRangeGap = true
): {
  start: CalendarDateParts;
  end: CalendarDateParts;
  lockReject: boolean;
  constraint?: 'min-gap' | 'max-gap';
} {
  const e0 = clampDateParts(proposedEnd);
  const s0 = clampDateParts(currentStart);
  if (!enforceRangeGap) {
    return {
      start: s0,
      end: e0,
      lockReject: false,
      constraint: undefined,
    };
  }

  const minDays = minDaysDefault(minGap);

  if (clampBehavior === 'lock') {
    const trial = normalizeCalendarEnds(s0, e0);
    if (violatesWindow(trial.start, trial.end, minDays, maxGap ?? undefined)) {
      return {
        start: currentStart,
        end: currentEnd,
        lockReject: true,
      };
    }
    return { start: trial.start, end: e0, lockReject: false };
  }

  let pair = normalizeCalendarEnds(s0, e0);
  if (diffUtcCalendarDays(pair.start, pair.end) < minDays) {
    pair = {
      start: pair.start,
      end: repairEndAfterStartChange(pair.start, pair.end, minDays, maxGap),
    };
  }
  if (maxGap !== undefined && Number.isFinite(maxGap)) {
    if (diffUtcCalendarDays(pair.start, pair.end) > maxGap) {
      pair = {
        start: pair.start,
        end: addCalendarDays(pair.start, Math.floor(maxGap)),
      };
    }
  }
  pair = {
    start: pair.start,
    end: clampDateParts(pair.end),
  };
  return {
    start: pair.start,
    end: pair.end,
    lockReject: false,
    constraint:
      utcTimestamp(pair.end) !== utcTimestamp(e0) ? 'min-gap' : undefined,
  };
}
