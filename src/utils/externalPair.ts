import type { DualPickerDatum } from './datum';
import { datumToIndex } from './datum';
import { clampIndex, normalizeExternalRange } from './rangeUtils';

/**
 * Normalizes controlled `{ start, end }` onto `sorted` respecting gap rules.
 * `index` gap: min/max apply to **positions** in `sorted` (string lists, month names).
 * `value` gap: min/max apply to **numeric difference** (legacy `range`, years, decimals).
 */
export function normalizeExternalPair(
  sorted: readonly DualPickerDatum[],
  gapBasis: 'value' | 'index',
  start: DualPickerDatum,
  end: DualPickerDatum,
  minGap?: number,
  maxGap?: number,
  enforceRangeGap = true
): { start: DualPickerDatum; end: DualPickerDatum } {
  if (sorted.length === 0) {
    return { start, end };
  }
  if (!enforceRangeGap) {
    const si = clampIndex(datumToIndex(sorted, start), sorted.length - 1);
    const ei = clampIndex(datumToIndex(sorted, end), sorted.length - 1);
    return { start: sorted[si]!, end: sorted[ei]! };
  }
  if (gapBasis === 'index') {
    const idxLine = sorted.map((_, i) => i);
    const si = datumToIndex(sorted, start);
    const ei = datumToIndex(sorted, end);
    const n = normalizeExternalRange(idxLine, si, ei, minGap, maxGap);
    return {
      start: sorted[n.start]!,
      end: sorted[n.end]!,
    };
  }
  const n = normalizeExternalRange(
    sorted as unknown as number[],
    Number(start),
    Number(end),
    minGap,
    maxGap
  );
  return { start: n.start, end: n.end };
}
