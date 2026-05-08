import type { DualPickerValue } from '../types';
import { clampIndex, indexOfClosest, nearlyEqual } from './rangeUtils';

export type DualPickerDatum = DualPickerValue;

export function datumEquals(a: DualPickerDatum, b: DualPickerDatum): boolean {
  if (typeof a === 'number' && typeof b === 'number') return nearlyEqual(a, b);
  return a === b;
}

/** First index whose entry matches `d` (fuzzy numbers, exact strings). */
export function datumToIndex(
  sorted: readonly DualPickerDatum[],
  d: DualPickerDatum
): number {
  if (sorted.length === 0) return 0;
  for (let i = 0; i < sorted.length; i++) {
    const v = sorted[i]!;
    if (datumEquals(v, d)) return i;
  }
  if (typeof d === 'number') {
    return clampIndex(
      indexOfClosest(sorted as readonly number[], d),
      sorted.length - 1
    );
  }
  return clampIndex(sorted.indexOf(d), sorted.length - 1);
}

export function findMatchingDatum(
  sorted: readonly DualPickerDatum[],
  picked: DualPickerDatum
): DualPickerDatum | undefined {
  for (let i = 0; i < sorted.length; i++) {
    const v = sorted[i]!;
    if (datumEquals(v, picked)) return v;
  }
  return undefined;
}

export function datumIndexClosest(
  sorted: readonly DualPickerDatum[],
  v: DualPickerDatum
): number {
  if (sorted.length === 0) return 0;
  if (typeof v === 'number') {
    return clampIndex(
      indexOfClosest(sorted as readonly number[], v),
      sorted.length - 1
    );
  }
  const hit = sorted.indexOf(v);
  return hit >= 0 ? hit : 0;
}
