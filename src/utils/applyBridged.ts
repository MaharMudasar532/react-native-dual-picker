import type { DualPickerDatum } from './datum';
import { datumEquals, datumToIndex } from './datum';
import type { ClampBehavior } from './rangeUtils';
import {
  applyEndColumnSelection,
  applyStartColumnSelection,
} from './rangeUtils';

export function applyStartWithGapBasis(
  sorted: readonly DualPickerDatum[],
  gapBasis: 'value' | 'index',
  proposedPick: DualPickerDatum,
  currentStart: DualPickerDatum,
  currentEnd: DualPickerDatum,
  minGap?: number,
  maxGap?: number,
  clampBehavior?: ClampBehavior,
  autoShiftEnd?: boolean,
  enforceRangeGap = true
): {
  start: DualPickerDatum;
  end: DualPickerDatum;
  lockReject: boolean;
  constraint?: 'min-gap' | 'max-gap';
} {
  if (!enforceRangeGap) {
    const start =
      sorted.find((v) => datumEquals(v, proposedPick)) ?? sorted[0]!;
    return {
      start,
      end: currentEnd,
      lockReject: false,
      constraint: undefined,
    };
  }
  if (gapBasis === 'index') {
    const proxy = sorted.map((_, i) => i);
    const r = applyStartColumnSelection(
      proxy,
      datumToIndex(sorted, proposedPick),
      datumToIndex(sorted, currentStart),
      datumToIndex(sorted, currentEnd),
      minGap,
      maxGap,
      clampBehavior,
      autoShiftEnd
    );
    return {
      start: sorted[r.start]!,
      end: sorted[r.end]!,
      lockReject: r.lockReject,
      constraint: r.constraint,
    };
  }

  const r = applyStartColumnSelection(
    sorted as unknown as number[],
    Number(proposedPick),
    Number(currentStart),
    Number(currentEnd),
    minGap,
    maxGap,
    clampBehavior,
    autoShiftEnd
  );
  return {
    start: r.start,
    end: r.end,
    lockReject: r.lockReject,
    constraint: r.constraint,
  };
}

export function applyEndWithGapBasis(
  sorted: readonly DualPickerDatum[],
  gapBasis: 'value' | 'index',
  proposedPick: DualPickerDatum,
  currentStart: DualPickerDatum,
  currentEnd: DualPickerDatum,
  minGap?: number,
  maxGap?: number,
  clampBehavior?: ClampBehavior,
  enforceRangeGap = true
): {
  start: DualPickerDatum;
  end: DualPickerDatum;
  lockReject: boolean;
  constraint?: 'min-gap' | 'max-gap';
} {
  if (!enforceRangeGap) {
    const end = sorted.find((v) => datumEquals(v, proposedPick)) ?? sorted[0]!;
    return {
      start: currentStart,
      end,
      lockReject: false,
      constraint: undefined,
    };
  }
  if (gapBasis === 'index') {
    const proxy = sorted.map((_, i) => i);
    const r = applyEndColumnSelection(
      proxy,
      datumToIndex(sorted, proposedPick),
      datumToIndex(sorted, currentStart),
      datumToIndex(sorted, currentEnd),
      minGap,
      maxGap,
      clampBehavior
    );
    return {
      start: sorted[r.start]!,
      end: sorted[r.end]!,
      lockReject: r.lockReject,
      constraint: r.constraint,
    };
  }

  const r = applyEndColumnSelection(
    sorted as unknown as number[],
    Number(proposedPick),
    Number(currentStart),
    Number(currentEnd),
    minGap,
    maxGap,
    clampBehavior
  );
  return {
    start: r.start,
    end: r.end,
    lockReject: r.lockReject,
    constraint: r.constraint,
  };
}
