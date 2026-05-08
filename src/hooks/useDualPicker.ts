/**
 * Dual picker commits when each column settles (snap completes). `{ start, end }`
 * updates commit there — no rolling `setState` on `onScroll`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DualPickerClampBehavior,
  DualPickerChangeReason,
  DualPickerProps,
  DualPickerRange,
  DualPickerValue,
} from '../types';
import {
  applyEndWithGapBasis,
  applyStartWithGapBasis,
} from '../utils/applyBridged';
import { datumEquals, datumToIndex } from '../utils/datum';
import { inferGapBasis, resolveModeSorted } from '../utils/dualPickerModes';
import { normalizeExternalPair } from '../utils/externalPair';
import { clampIndex, yForIndex } from '../utils/rangeUtils';

type UseDualPickerArgs = Omit<
  Pick<
    DualPickerProps,
    | 'mode'
    | 'modeOptions'
    | 'gapBasis'
    | 'data'
    | 'value'
    | 'onChange'
    | 'minGap'
    | 'maxGap'
    | 'enforceRangeGap'
    | 'step'
    | 'itemHeight'
    | 'clampBehavior'
    | 'autoShiftEnd'
  >,
  'value'
> & { value: DualPickerRange };

function scheduleDoubleRaf(cb: () => void): number {
  return requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

function reasonAfterStartPick(
  constraint: 'min-gap' | 'max-gap' | undefined,
  prev: DualPickerRange,
  next: DualPickerRange
): DualPickerChangeReason {
  if (constraint === 'min-gap') return 'min-gap-enforced';
  if (constraint === 'max-gap') return 'max-gap-enforced';
  if (
    !datumEquals(prev.start, next.start) ||
    !datumEquals(prev.end, next.end)
  ) {
    return 'user-scroll-start';
  }
  return 'user-scroll-start';
}

function reasonAfterEndPick(
  constraint: 'min-gap' | 'max-gap' | undefined,
  prev: DualPickerRange,
  next: DualPickerRange
): DualPickerChangeReason {
  if (constraint === 'min-gap') return 'min-gap-enforced';
  if (constraint === 'max-gap') return 'max-gap-enforced';
  if (
    !datumEquals(prev.start, next.start) ||
    !datumEquals(prev.end, next.end)
  ) {
    return 'user-scroll-end';
  }
  return 'user-scroll-end';
}

export function useDualPicker({
  mode,
  modeOptions,
  gapBasis: gapBasisProp,
  data,
  value,
  onChange,
  minGap,
  maxGap,
  enforceRangeGap = true,
  step,
  itemHeight = 44,
  clampBehavior = 'push-end' as DualPickerClampBehavior,
  autoShiftEnd = true,
}: UseDualPickerArgs) {
  if (mode === 'date') {
    throw new Error(
      '[useDualPicker] `mode="date"` is handled by DualPickerCalendar, not useDualPicker.'
    );
  }
  const sorted = useMemo(
    () => resolveModeSorted(mode, data, step, modeOptions),
    [data, mode, modeOptions, step]
  );

  const resolvedGapBasis = useMemo(
    () => gapBasisProp ?? inferGapBasis(sorted),
    [gapBasisProp, sorted]
  );

  const [range, setRange] = useState<DualPickerRange>(() =>
    normalizeExternalPair(
      sorted,
      resolvedGapBasis,
      value.start,
      value.end,
      minGap,
      maxGap,
      enforceRangeGap
    )
  );

  const ignoreStartMomentumRef = useRef(0);
  const ignoreEndMomentumRef = useRef(0);
  /** Programmatic scroll targets (FIFO) — only skip `onWheelSettled` when it matches the head. */
  const expectedStartAfterProgrammaticRef = useRef<DualPickerValue[]>([]);
  const expectedEndAfterProgrammaticRef = useRef<DualPickerValue[]>([]);
  /** Avoid overwriting local `range` from stale `value` before parent applies `onChange`. */
  const pendingControlledEmitRef = useRef<DualPickerRange | null>(null);
  const controlledValueSnapshotBeforeEmitRef = useRef<{
    start: DualPickerValue;
    end: DualPickerValue;
  } | null>(null);

  const pendingScrollFlushRafRef = useRef<number | null>(null);
  const scrollOpQueueRef = useRef<
    Array<{
      doScroll: (y: number, animated: boolean) => void;
      y: number;
      animated: boolean;
    }>
  >([]);

  const bumpIgnoreStart = useCallback(() => {
    ignoreStartMomentumRef.current += 1;
  }, []);
  const bumpIgnoreEnd = useCallback(() => {
    ignoreEndMomentumRef.current += 1;
  }, []);

  const cancelPendingScrollFlush = () => {
    if (pendingScrollFlushRafRef.current != null) {
      cancelAnimationFrame(pendingScrollFlushRafRef.current);
      pendingScrollFlushRafRef.current = null;
    }
    scrollOpQueueRef.current = [];
  };

  useEffect(() => () => cancelPendingScrollFlush(), []);

  useEffect(() => {
    const norm = normalizeExternalPair(
      sorted,
      resolvedGapBasis,
      value.start,
      value.end,
      minGap,
      maxGap,
      enforceRangeGap
    );

    const pending = pendingControlledEmitRef.current;
    if (pending != null) {
      const parentCaughtUp =
        datumEquals(norm.start, pending.start) &&
        datumEquals(norm.end, pending.end);
      if (parentCaughtUp) {
        pendingControlledEmitRef.current = null;
        controlledValueSnapshotBeforeEmitRef.current = null;
        setRange((prev) =>
          datumEquals(prev.start, norm.start) && datumEquals(prev.end, norm.end)
            ? prev
            : norm
        );
        return;
      }

      const snap = controlledValueSnapshotBeforeEmitRef.current;
      const parentStillStale =
        snap != null &&
        datumEquals(value.start, snap.start) &&
        datumEquals(value.end, snap.end);

      if (parentStillStale) {
        /** Keep local `range` from `emit` until `value` prop updates */
        return;
      }

      pendingControlledEmitRef.current = null;
      controlledValueSnapshotBeforeEmitRef.current = null;
    }

    setRange((prev) =>
      datumEquals(prev.start, norm.start) && datumEquals(prev.end, norm.end)
        ? prev
        : norm
    );
  }, [
    enforceRangeGap,
    resolvedGapBasis,
    sorted,
    value.start,
    value.end,
    minGap,
    maxGap,
  ]);

  const emit = useCallback(
    (next: DualPickerRange, reason: DualPickerChangeReason) => {
      controlledValueSnapshotBeforeEmitRef.current = {
        start: value.start,
        end: value.end,
      };
      pendingControlledEmitRef.current = next;
      setRange(next);
      onChange?.(next, { reason });
    },
    [onChange, value.end, value.start]
  );

  const scrollToY = useCallback(
    (
      doScroll: ((y: number, animated: boolean) => void) | undefined,
      dataValue: DualPickerValue,
      bump: () => void,
      animated: boolean,
      /** Which wheel is being moved — used to pair ignore counts with expected settle values. */
      programmaticColumn?: 'start' | 'end'
    ) => {
      if (!doScroll) return;
      if (animated) {
        bump();
        if (programmaticColumn === 'start') {
          expectedStartAfterProgrammaticRef.current.push(dataValue);
        } else if (programmaticColumn === 'end') {
          expectedEndAfterProgrammaticRef.current.push(dataValue);
        }
      }

      const safeIdx = clampIndex(
        datumToIndex(sorted, dataValue),
        Math.max(0, sorted.length - 1)
      );
      const maxY =
        sorted.length <= 0 ? 0 : Math.max(0, (sorted.length - 1) * itemHeight);
      const y = Math.min(maxY, yForIndex(safeIdx, itemHeight));

      scrollOpQueueRef.current.push({ doScroll, y, animated });

      if (pendingScrollFlushRafRef.current != null) {
        return;
      }
      pendingScrollFlushRafRef.current = scheduleDoubleRaf(() => {
        pendingScrollFlushRafRef.current = null;
        const ops = [...scrollOpQueueRef.current];
        scrollOpQueueRef.current = [];
        for (const op of ops) {
          op.doScroll(op.y, op.animated);
        }
      });
    },
    [itemHeight, sorted]
  );

  const commitStartWheel = useCallback(
    (
      proposedPick: DualPickerValue,
      scrollEndColumn: (y: number, animated: boolean) => void,
      scrollStartColumn: (y: number, animated: boolean) => void
    ) => {
      if (ignoreStartMomentumRef.current > 0) {
        const q = expectedStartAfterProgrammaticRef.current;
        const head = q[0];
        if (head !== undefined && datumEquals(head, proposedPick)) {
          ignoreStartMomentumRef.current -= 1;
          q.shift();
          return;
        }
        ignoreStartMomentumRef.current = 0;
        q.length = 0;
      }

      const proposed =
        sorted.find((v) => datumEquals(v, proposedPick)) ?? sorted[0]!;

      const result = applyStartWithGapBasis(
        sorted,
        resolvedGapBasis,
        proposed,
        range.start,
        range.end,
        minGap,
        maxGap,
        clampBehavior,
        autoShiftEnd,
        enforceRangeGap
      );

      if (result.lockReject) {
        scrollToY(
          scrollStartColumn,
          range.start,
          bumpIgnoreStart,
          true,
          'start'
        );
        return;
      }

      if (!datumEquals(proposed, result.start)) {
        scrollToY(
          scrollStartColumn,
          result.start,
          bumpIgnoreStart,
          true,
          'start'
        );
      }

      const nextRange = { start: result.start, end: result.end };
      const prevRange = range;
      const changed =
        !datumEquals(prevRange.start, nextRange.start) ||
        !datumEquals(prevRange.end, nextRange.end);

      if (changed) {
        emit(
          nextRange,
          reasonAfterStartPick(result.constraint, prevRange, nextRange)
        );
      }

      if (!datumEquals(result.end, range.end)) {
        scrollToY(scrollEndColumn, result.end, bumpIgnoreEnd, true, 'end');
      }
    },
    [
      autoShiftEnd,
      bumpIgnoreEnd,
      bumpIgnoreStart,
      clampBehavior,
      emit,
      enforceRangeGap,
      maxGap,
      minGap,
      range,
      resolvedGapBasis,
      scrollToY,
      sorted,
    ]
  );

  const commitEndWheel = useCallback(
    (
      proposedPick: DualPickerValue,
      scrollEndColumn: (y: number, animated: boolean) => void,
      scrollStartColumn: (y: number, animated: boolean) => void
    ) => {
      if (ignoreEndMomentumRef.current > 0) {
        const q = expectedEndAfterProgrammaticRef.current;
        const head = q[0];
        if (head !== undefined && datumEquals(head, proposedPick)) {
          ignoreEndMomentumRef.current -= 1;
          q.shift();
          return;
        }
        ignoreEndMomentumRef.current = 0;
        q.length = 0;
      }

      const proposed =
        sorted.find((v) => datumEquals(v, proposedPick)) ?? sorted[0]!;

      const result = applyEndWithGapBasis(
        sorted,
        resolvedGapBasis,
        proposed,
        range.start,
        range.end,
        minGap,
        maxGap,
        clampBehavior,
        enforceRangeGap
      );

      if (result.lockReject) {
        scrollToY(scrollEndColumn, range.end, bumpIgnoreEnd, true, 'end');
        return;
      }

      if (!datumEquals(proposed, result.end)) {
        scrollToY(scrollEndColumn, result.end, bumpIgnoreEnd, true, 'end');
      }
      if (!datumEquals(range.start, result.start)) {
        scrollToY(
          scrollStartColumn,
          result.start,
          bumpIgnoreStart,
          true,
          'start'
        );
      }

      const nextRange = { start: result.start, end: result.end };
      const prevRange = range;
      const changed =
        !datumEquals(prevRange.start, nextRange.start) ||
        !datumEquals(prevRange.end, nextRange.end);

      if (changed) {
        emit(
          nextRange,
          reasonAfterEndPick(result.constraint, prevRange, nextRange)
        );
      }
    },
    [
      bumpIgnoreEnd,
      bumpIgnoreStart,
      clampBehavior,
      emit,
      enforceRangeGap,
      maxGap,
      minGap,
      range,
      resolvedGapBasis,
      scrollToY,
      sorted,
    ]
  );

  const scrollBothToControlled = useCallback(
    (
      scrollStartColumn: ((y: number, animated: boolean) => void) | undefined,
      scrollEndColumn: ((y: number, animated: boolean) => void) | undefined,
      animated: boolean
    ) => {
      const normalized = normalizeExternalPair(
        sorted,
        resolvedGapBasis,
        value.start,
        value.end,
        minGap,
        maxGap,
        enforceRangeGap
      );
      scrollToY(
        scrollStartColumn,
        normalized.start,
        bumpIgnoreStart,
        animated,
        animated ? 'start' : undefined
      );
      scrollToY(
        scrollEndColumn,
        normalized.end,
        bumpIgnoreEnd,
        animated,
        animated ? 'end' : undefined
      );
    },
    [
      bumpIgnoreEnd,
      bumpIgnoreStart,
      enforceRangeGap,
      maxGap,
      minGap,
      resolvedGapBasis,
      scrollToY,
      sorted,
      value.end,
      value.start,
    ]
  );

  return {
    sorted,
    range,
    itemHeight,
    resolvedGapBasis,
    commitStartWheel,
    commitEndWheel,
    scrollBothToControlled,
    bumpIgnoreStart,
    bumpIgnoreEnd,
    scrollToY,
  };
}
