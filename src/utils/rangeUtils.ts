const EPS = 1e-9;

export function nearlyEqual(a: number, b: number, eps = EPS): boolean {
  return Math.abs(a - b) < eps;
}

export function sortUniqueNumbers(values: number[]): number[] {
  const set = new Set<number>();
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) set.add(v);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Filters `sorted` to values on a step grid anchored at `sorted[0]`.
 */
export function maybeApplyStep(
  sorted: readonly number[],
  step?: number
): number[] {
  const values = [...sorted];
  if (
    step == null ||
    !Number.isFinite(step) ||
    step <= 0 ||
    values.length === 0
  ) {
    return values;
  }
  const anchor = values[0]!;
  return values.filter((v) =>
    nearlyEqual((v - anchor) / step, Math.round((v - anchor) / step))
  );
}

export function clampIndex(i: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(i, 0), len - 1);
}

export function indexOfClosest(
  sorted: readonly number[],
  value: number
): number {
  if (sorted.length === 0) return -1;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < sorted.length; i++) {
    const cand = sorted[i]!;
    const d = Math.abs(cand - value);
    if (d < bestDist - EPS) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** Nearest datum to `value` */
export function snapNearest(sorted: readonly number[], value: number): number {
  if (sorted.length === 0) {
    throw new RangeError('[DualPicker] Empty `data`.');
  }
  const at = sorted[clampIndex(indexOfClosest(sorted, value), sorted.length)];
  if (typeof at !== 'number' || Number.isNaN(at)) {
    throw new RangeError('[DualPicker] Unexpected empty pickable bucket.');
  }
  return at;
}

/**
 * Smallest sorted value strictly ≥ `target`.
 */
export function ceilInSorted(
  sorted: readonly number[],
  target: number
): number | undefined {
  for (const v of sorted) {
    if (v >= target - EPS || nearlyEqual(v, target)) return v;
  }
  return undefined;
}

/**
 * Greatest sorted value strictly ≤ `target`.
 */
export function floorInSorted(
  sorted: readonly number[],
  target: number
): number | undefined {
  for (let i = sorted.length - 1; i >= 0; i--) {
    const v = sorted[i]!;
    if (v <= target + EPS || nearlyEqual(v, target)) return v;
  }
  return undefined;
}

function minNumericGap(minGap?: number): number {
  const g =
    typeof minGap === 'number' && Number.isFinite(minGap) && minGap > 0
      ? minGap
      : 1;
  return g;
}

/**
 * Computes the smallest selectable end satisfying gap rules for fixed `start` (datum).
 */
export function smallestValidEnd(
  sorted: readonly number[],
  start: number,
  minGap?: number,
  maxGap?: number
): number {
  if (sorted.length === 0) {
    throw new RangeError('[DualPicker] `data` is empty.');
  }
  const fallbackLast = (): number =>
    sorted[sorted.length - 1] ??
    (() => {
      throw new RangeError('[DualPicker] Unexpected empty datum array.');
    })();

  const g = minNumericGap(minGap);
  const need = start + g;
  let end = ceilInSorted(sorted, need);
  if (end === undefined) return fallbackLast();

  if (maxGap !== undefined && Number.isFinite(maxGap)) {
    const cap = start + maxGap;
    if (end > cap + EPS) {
      const windowed = sorted.filter((v) => v >= need - EPS && v <= cap + EPS);
      if (windowed.length > 0) {
        end = windowed[0]!;
      } else {
        /** No end inside window—push `start` left until window exists */
        const moved = moveStartLeftForFeasibility(sorted, start, g, maxGap);
        if (!nearlyEqual(moved, start)) {
          return smallestValidEnd(sorted, moved, minGap, maxGap);
        }
        /** Best-effort: prefer satisfying minGap even if it exceeds maxGap slightly */
        end = ceilInSorted(sorted, start + g) ?? fallbackLast();
      }
    }
  }
  if (end === undefined) end = fallbackLast();
  return end;
}

function moveStartLeftForFeasibility(
  sorted: readonly number[],
  start: number,
  minGap: number,
  maxGap: number
): number {
  const idx = sorted.indexOf(start);
  if (idx <= 0) return start;
  for (let i = idx - 1; i >= 0; i--) {
    const s = sorted[i]!;
    const need = s + minGap;
    const cap = s + maxGap;
    const hit = sorted.find((v) => v >= need - EPS && v <= cap + EPS);
    if (hit !== undefined) return s;
  }
  return sorted[0]!;
}

/**
 * After user picks a tentative end (snapped to data), enforce `end >= start + minGap` and `maxGap`.
 */
export function clampTentativeEnd(
  sorted: readonly number[],
  start: number,
  tentativeEnd: number,
  minGap?: number,
  maxGap?: number
): number {
  const g = minNumericGap(minGap);
  const floorPick =
    ceilInSorted(sorted, start + g) ?? sorted[sorted.length - 1]!;
  let end = snapNearest(sorted, tentativeEnd);
  if (end < floorPick - EPS) end = floorPick;

  if (maxGap !== undefined && Number.isFinite(maxGap)) {
    const cap = start + maxGap;
    if (end > cap + EPS) {
      const fit = floorInSorted(sorted, cap);
      if (fit !== undefined && fit >= floorPick - EPS) return fit;
      return floorPick;
    }
  }
  return end;
}

/**
 * After `start` changes, ensure `end` still respects constraints (may increase end only).
 */
export function repairEndAfterStartChange(
  sorted: readonly number[],
  start: number,
  currentEnd: number,
  minGap?: number,
  maxGap?: number
): number {
  const g = minNumericGap(minGap);
  const minNeed = start + g;
  if (currentEnd >= minNeed - EPS) {
    if (maxGap !== undefined && Number.isFinite(maxGap)) {
      const cap = start + maxGap;
      if (currentEnd > cap + EPS) {
        const fit = floorInSorted(sorted, cap);
        if (fit !== undefined && fit >= minNeed - EPS) return fit;
        return smallestValidEnd(sorted, start, minGap, maxGap);
      }
    }
    return currentEnd;
  }
  return smallestValidEnd(sorted, start, minGap, maxGap);
}

export type ClampBehavior = 'push-end' | 'push-start' | 'lock';

function pairViolatesMinGap(
  start: number,
  end: number,
  minGap?: number
): boolean {
  const g = minNumericGap(minGap);
  return end < start + g - EPS;
}

function pairViolatesMaxGap(
  start: number,
  end: number,
  maxGap?: number
): boolean {
  if (maxGap === undefined || !Number.isFinite(maxGap)) return false;
  return end > start + maxGap + EPS;
}

/**
 * Adjust **start** (only) so `{ start, fixedEnd }` satisfies gaps on `sorted`.
 * Iterates min/max constraints until stable.
 */
function pullStartToMatchEnd(
  sorted: readonly number[],
  proposedStart: number,
  fixedEnd: number,
  minGap?: number,
  maxGap?: number
): { start: number; constraint?: 'min-gap' | 'max-gap' } {
  let s = snapNearest(sorted, proposedStart);
  const g = minNumericGap(minGap);
  let constraint: 'min-gap' | 'max-gap' | undefined;

  for (let k = 0; k < 8; k++) {
    let changed = false;

    if (pairViolatesMinGap(s, fixedEnd, minGap)) {
      const cap = floorInSorted(sorted, fixedEnd - g);
      if (cap !== undefined && !nearlyEqual(s, cap)) {
        s = cap;
        constraint = 'min-gap';
        changed = true;
      }
    }
    if (pairViolatesMaxGap(s, fixedEnd, maxGap) && maxGap !== undefined) {
      const need = ceilInSorted(sorted, fixedEnd - maxGap);
      if (need !== undefined && !nearlyEqual(s, need)) {
        s = need;
        constraint = 'max-gap';
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { start: s, constraint };
}

/**
 * User finished scrolling the **start** column.
 */
export function applyStartColumnSelection(
  sorted: readonly number[],
  proposedStart: number,
  currentStart: number,
  currentEnd: number,
  minGap?: number,
  maxGap?: number,
  clampBehavior: ClampBehavior = 'push-end',
  autoShiftEnd = true
): {
  start: number;
  end: number;
  lockReject: boolean;
  constraint?: 'min-gap' | 'max-gap';
} {
  if (sorted.length === 0) {
    throw new RangeError('[DualPicker] `data` is empty.');
  }

  const s0 = snapNearest(sorted, proposedStart);

  if (clampBehavior === 'lock') {
    const valid =
      !pairViolatesMinGap(s0, currentEnd, minGap) &&
      !pairViolatesMaxGap(s0, currentEnd, maxGap);
    if (!valid) {
      return {
        start: currentStart,
        end: currentEnd,
        lockReject: true,
      };
    }
    return { start: s0, end: currentEnd, lockReject: false };
  }

  if (clampBehavior === 'push-end' && autoShiftEnd) {
    const nextEnd = repairEndAfterStartChange(
      sorted,
      s0,
      currentEnd,
      minGap,
      maxGap
    );
    let constraint: 'min-gap' | 'max-gap' | undefined;
    if (nextEnd !== currentEnd) {
      if (nextEnd > currentEnd) constraint = 'min-gap';
      else if (nextEnd < currentEnd) constraint = 'max-gap';
    }
    return { start: s0, end: nextEnd, lockReject: false, constraint };
  }

  const pulled = pullStartToMatchEnd(
    sorted,
    proposedStart,
    currentEnd,
    minGap,
    maxGap
  );
  return {
    start: pulled.start,
    end: currentEnd,
    lockReject: false,
    constraint: pulled.constraint,
  };
}

/**
 * User finished scrolling the **end** column.
 */
export function applyEndColumnSelection(
  sorted: readonly number[],
  proposedEnd: number,
  currentStart: number,
  currentEnd: number,
  minGap?: number,
  maxGap?: number,
  clampBehavior: ClampBehavior = 'push-end'
): {
  start: number;
  end: number;
  lockReject: boolean;
  constraint?: 'min-gap' | 'max-gap';
} {
  if (sorted.length === 0) {
    throw new RangeError('[DualPicker] `data` is empty.');
  }

  if (clampBehavior === 'lock') {
    const e0 = snapNearest(sorted, proposedEnd);
    const valid =
      !pairViolatesMinGap(currentStart, e0, minGap) &&
      !pairViolatesMaxGap(currentStart, e0, maxGap);
    if (!valid) {
      return {
        start: currentStart,
        end: currentEnd,
        lockReject: true,
      };
    }
    return { start: currentStart, end: e0, lockReject: false };
  }

  if (clampBehavior === 'push-end') {
    const raw = snapNearest(sorted, proposedEnd);
    const e = clampTentativeEnd(
      sorted,
      currentStart,
      proposedEnd,
      minGap,
      maxGap
    );
    let constraint: 'min-gap' | 'max-gap' | undefined;
    if (e !== raw) {
      constraint = e < raw - EPS ? 'min-gap' : 'max-gap';
    }
    return { start: currentStart, end: e, lockReject: false, constraint };
  }

  const e = snapNearest(sorted, proposedEnd);
  const pulled = pullStartToMatchEnd(sorted, currentStart, e, minGap, maxGap);
  return {
    start: pulled.start,
    end: e,
    lockReject: false,
    constraint: pulled.constraint,
  };
}

/**
 * Normalizes external controlled `value` into a consistent pair (snapped + gap-safe).
 */
export function normalizeExternalRange(
  sorted: readonly number[],
  start: number,
  end: number,
  minGap?: number,
  maxGap?: number
): { start: number; end: number } {
  let s = snapNearest(sorted, start);
  let e = snapNearest(sorted, end);
  e = clampTentativeEnd(sorted, s, e, minGap, maxGap);
  if (e < s + minNumericGap(minGap) - EPS) {
    e = smallestValidEnd(sorted, s, minGap, maxGap);
  }
  return { start: s, end: e };
}

export function yForIndex(index: number, itemHeight: number): number {
  return index * itemHeight;
}

export function indexFromOffset(
  y: number,
  itemHeight: number,
  length: number
): number {
  if (length <= 0 || itemHeight <= 0) return 0;
  const maxY = Math.max(0, (length - 1) * itemHeight);
  const clampedY = Math.min(maxY, Math.max(0, y));
  return clampIndex(Math.round(clampedY / itemHeight), length);
}
