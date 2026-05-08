import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type {
  CalendarDateParts,
  DualPickerCalendarRange,
  DualPickerCalendarRangeInput,
  DualPickerChangeReason,
  DualPickerDateFormat,
  DualPickerProps,
  DualPickerValue,
} from '../types';
import {
  applyCalendarEndWheel,
  applyCalendarStartWheel,
} from '../utils/calendarSelection';
import {
  clampDateParts,
  clampPartsToYearRange,
  daysInMonth,
  partsEqual,
} from '../utils/calendarDate';
import {
  calendarYearBoundsFromOptions,
  normalizeDualPickerCalendarValue,
} from '../utils/dualPickerCalendarValue';
import { datumToIndex } from '../utils/datum';
import { yForIndex } from '../utils/rangeUtils';
import {
  PickerColumn,
  type PickerColumnHandle,
  type PickerWheelSettledPayload,
} from './PickerColumn';

const DEFAULT_VISIBLE = 5;

function scheduleDoubleRaf(cb: () => void): number {
  return requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

type CalendarField = 'year' | 'month' | 'day';

function layoutTripleOrder(
  fmt: DualPickerDateFormat
): readonly CalendarField[] {
  switch (fmt) {
    case 'eu':
      return ['day', 'month', 'year'];
    case 'us':
      return ['month', 'day', 'year'];
    default:
      return ['year', 'month', 'day'];
  }
}

function miniFieldLabel(f: CalendarField): string {
  if (f === 'year') return 'Y';
  if (f === 'month') return 'M';
  return 'D';
}

function buildDayListFor(p: CalendarDateParts): number[] {
  const dim = daysInMonth(p.year, p.month);
  return Array.from({ length: dim }, (_, i) => i + 1);
}

function reasonStart(
  constraint?: 'min-gap' | 'max-gap'
): DualPickerChangeReason {
  if (constraint === 'min-gap') return 'min-gap-enforced';
  if (constraint === 'max-gap') return 'max-gap-enforced';
  return 'user-scroll-start';
}

function reasonEnd(constraint?: 'min-gap' | 'max-gap'): DualPickerChangeReason {
  if (constraint === 'min-gap') return 'min-gap-enforced';
  if (constraint === 'max-gap') return 'max-gap-enforced';
  return 'user-scroll-end';
}

export function DualPickerCalendar(props: DualPickerProps & { mode: 'date' }) {
  const {
    modeOptions,
    clampBehavior = 'push-end',
    autoShiftEnd = true,
    minGap,
    maxGap,
    enforceRangeGap = true,
    value,
    onChange,
    itemHeight: itemHeightProp,
    visibleItemCount = DEFAULT_VISIBLE,
    style,
    containerStyle,
    startLabel = 'FROM',
    endLabel = 'TO',
    headerRowStyle,
    headerLabelStyle,
    headerLabelStartStyle,
    headerLabelEndStyle,
    pickerChromeStyle,
    highlightBandStyle,
    valueTextStyle,
    selectedValueTextStyle,
    valueCellStyle,
    selectedValueCellStyle,
    dateContentWrapperStyle,
    dateTitle,
    dateTitleWrapperStyle,
    dateTitleStyle,
    dateBetweenHalvesDividerStyle,
    dateBetweenHalvesDividerHeaderStyle,
    dateBetweenHalvesDividerFieldLabelsStyle,
    dateBetweenHalvesDividerWheelsStyle,
    dateFieldLabelsRowStyle,
    dateFieldCaptionTextStyle,
    dateWheelAreaStyle,
    dateWheelAreaBackgroundColor,
    dateSelectionLaneStyle,
    dateSelectionLaneBackgroundColor,
  } = props;

  const rowHeight = itemHeightProp ?? 44;
  const o = modeOptions ?? {};
  const fmt: DualPickerDateFormat = o.dateFormat ?? 'iso';
  const tripleOrder = useMemo(() => layoutTripleOrder(fmt), [fmt]);

  const { years, yMin, yMax } = useMemo(
    () => calendarYearBoundsFromOptions(modeOptions),
    [modeOptions]
  );

  const monthStyle = o.monthStyle ?? 'number';
  const monthLocale =
    o.dateLocale ??
    o.monthLocale ??
    Intl.DateTimeFormat().resolvedOptions().locale;

  const fmtMonth = useMemo(() => {
    if (monthStyle === 'number') return (m: number) => String(m);
    try {
      const f = new Intl.DateTimeFormat(monthLocale, {
        month: monthStyle === 'short' ? 'short' : 'long',
      });
      return (m: number) =>
        f.format(new Date(Date.UTC(2001, Math.min(11, Math.max(0, m - 1)), 1)));
    } catch {
      return (m: number) => String(m);
    }
  }, [monthLocale, monthStyle]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const calendarValueNormalized = useMemo(
    () =>
      normalizeDualPickerCalendarValue(
        value as DualPickerCalendarRange | DualPickerCalendarRangeInput,
        modeOptions,
        minGap ?? 1,
        maxGap ?? undefined,
        enforceRangeGap
      ),
    [enforceRangeGap, maxGap, minGap, modeOptions, value]
  );

  const calendarValuePropRef = useRef(calendarValueNormalized);
  calendarValuePropRef.current = calendarValueNormalized;

  const pendingControlledCalendarEmitRef =
    useRef<DualPickerCalendarRange | null>(null);
  const calendarValueSnapshotBeforeEmitRef = useRef<{
    start: CalendarDateParts;
    end: CalendarDateParts;
  } | null>(null);

  const [range, setRange] = useState<DualPickerCalendarRange>(() =>
    normalizeDualPickerCalendarValue(
      value as DualPickerCalendarRange | DualPickerCalendarRangeInput,
      modeOptions,
      minGap ?? 1,
      maxGap ?? undefined,
      enforceRangeGap
    )
  );

  const ref0 = useRef<PickerColumnHandle>(null);
  const ref1 = useRef<PickerColumnHandle>(null);
  const ref2 = useRef<PickerColumnHandle>(null);
  const ref3 = useRef<PickerColumnHandle>(null);
  const ref4 = useRef<PickerColumnHandle>(null);
  const ref5 = useRef<PickerColumnHandle>(null);
  const refs = useMemo(() => [ref0, ref1, ref2, ref3, ref4, ref5] as const, []);

  /** FIFO of programmatic scroll targets per wheel ix — skip `onWheelSettled` only when `picked === head`. */
  const expectedProgrammaticPickRef = useRef<
    [number[], number[], number[], number[], number[], number[]]
  >([[], [], [], [], [], []]);
  const pendingFlushRef = useRef<number | null>(null);
  const scrollQueueRef = useRef<
    Array<{ scroll: (y: number, a: boolean) => void; y: number; a: boolean }>
  >([]);

  useEffect(
    () => () => {
      if (pendingFlushRef.current != null) {
        cancelAnimationFrame(pendingFlushRef.current);
      }
      scrollQueueRef.current = [];
    },
    []
  );

  const flushScrollQueue = useCallback(() => {
    pendingFlushRef.current = null;
    const ops = [...scrollQueueRef.current];
    scrollQueueRef.current = [];
    for (const op of ops) {
      op.scroll(op.y, op.a);
    }
  }, []);

  const scrollColumn = useCallback(
    (
      ix: 0 | 1 | 2 | 3 | 4 | 5,
      doScroll: ((y: number, animated: boolean) => void) | undefined,
      values: readonly number[],
      datum: number,
      animated: boolean
    ) => {
      if (!doScroll) return;
      const vmax = Math.max(0, values.length - 1);
      const idx = Math.max(
        0,
        Math.min(vmax, datumToIndex(values as unknown as number[], datum))
      );
      if (animated) {
        const atIdx = values[idx];
        const expect =
          typeof atIdx === 'number'
            ? atIdx
            : typeof atIdx === 'string'
              ? Number(atIdx)
              : Number.NaN;
        if (Number.isFinite(expect)) {
          expectedProgrammaticPickRef.current[ix].push(expect);
        }
      }
      const y = yForIndex(idx, rowHeight);
      scrollQueueRef.current.push({ scroll: doScroll, y, a: animated });
      if (pendingFlushRef.current != null) return;
      pendingFlushRef.current = scheduleDoubleRaf(flushScrollQueue);
    },
    [flushScrollQueue, rowHeight]
  );

  const scrollHalf = useCallback(
    (
      baseIx: 0 | 3,
      parts: CalendarDateParts,
      order: readonly CalendarField[],
      animated: boolean
    ) => {
      for (let slot = 0; slot < 3; slot++) {
        const field = order[slot]!;
        const wheelIx = (baseIx + slot) as 0 | 1 | 2 | 3 | 4 | 5;
        const colRef = refs[wheelIx]!;
        const doScroll = (y: number, a: boolean) =>
          colRef.current?.scrollToOffset(y, a);
        if (field === 'year') {
          scrollColumn(wheelIx, doScroll, years, parts.year, animated);
        } else if (field === 'month') {
          scrollColumn(wheelIx, doScroll, months, parts.month, animated);
        } else {
          const ds = buildDayListFor(parts);
          scrollColumn(wheelIx, doScroll, ds, parts.day, animated);
        }
      }
    },
    [months, refs, scrollColumn, years]
  );

  const lastSyncedKey = useRef<string | null>(null);
  useLayoutEffect(() => {
    const norm = calendarValueNormalized;

    const pending = pendingControlledCalendarEmitRef.current;
    if (pending != null) {
      const parentCaughtUp =
        partsEqual(norm.start, pending.start) &&
        partsEqual(norm.end, pending.end);
      if (parentCaughtUp) {
        pendingControlledCalendarEmitRef.current = null;
        calendarValueSnapshotBeforeEmitRef.current = null;
        const key = JSON.stringify({
          n: norm,
          yMin,
          yMax,
          fmt,
        });
        lastSyncedKey.current = key;
        setRange(norm);
        scrollHalf(0, norm.start, tripleOrder, false);
        scrollHalf(3, norm.end, tripleOrder, false);
        return;
      }

      const snap = calendarValueSnapshotBeforeEmitRef.current;
      const parentStillStale =
        snap != null &&
        partsEqual(calendarValueNormalized.start, snap.start) &&
        partsEqual(calendarValueNormalized.end, snap.end);

      if (parentStillStale) {
        return;
      }

      pendingControlledCalendarEmitRef.current = null;
      calendarValueSnapshotBeforeEmitRef.current = null;
    }

    const key = JSON.stringify({
      n: norm,
      yMin,
      yMax,
      fmt,
    });
    if (lastSyncedKey.current === key) return;
    lastSyncedKey.current = key;
    setRange(norm);
    scrollHalf(0, norm.start, tripleOrder, false);
    scrollHalf(3, norm.end, tripleOrder, false);
  }, [calendarValueNormalized, fmt, scrollHalf, tripleOrder, yMax, yMin]);

  const emit = useCallback(
    (next: DualPickerCalendarRange, reason: DualPickerChangeReason) => {
      const v = calendarValuePropRef.current;
      calendarValueSnapshotBeforeEmitRef.current = {
        start: { ...v.start },
        end: { ...v.end },
      };
      pendingControlledCalendarEmitRef.current = {
        start: { ...next.start },
        end: { ...next.end },
      };
      setRange(next);
      onChange?.(next, { reason });
    },
    [onChange]
  );

  const consumeOrClearProgrammaticSettle = useCallback(
    (ix: 0 | 1 | 2 | 3 | 4 | 5, picked: number): boolean => {
      const q = expectedProgrammaticPickRef.current[ix];
      if (q.length === 0) return false;
      const head = q[0];
      if (head !== undefined && head === picked) {
        q.shift();
        return true;
      }
      q.length = 0;
      return false;
    },
    []
  );

  const handleStartField = useCallback(
    (slot: 0 | 1 | 2, picked: number) => {
      const ix = slot as 0 | 1 | 2;
      if (consumeOrClearProgrammaticSettle(ix, picked)) return;
      const field = tripleOrder[slot]!;
      let nextStart: CalendarDateParts = { ...range.start };
      if (field === 'year') nextStart.year = picked;
      else if (field === 'month') nextStart.month = picked;
      else nextStart.day = picked;
      nextStart = clampPartsToYearRange(clampDateParts(nextStart), yMin, yMax);

      const prevS = { ...range.start };
      const prevE = { ...range.end };
      const res = applyCalendarStartWheel(
        nextStart,
        range.start,
        range.end,
        minGap,
        maxGap,
        clampBehavior,
        autoShiftEnd,
        enforceRangeGap
      );
      if (res.lockReject) {
        scrollHalf(0, prevS, tripleOrder, true);
        scrollHalf(3, prevE, tripleOrder, true);
        return;
      }
      const changed =
        !partsEqual(res.start, prevS) || !partsEqual(res.end, prevE);
      if (changed) {
        emit(res, reasonStart(res.constraint));
        scrollHalf(0, res.start, tripleOrder, true);
        scrollHalf(3, res.end, tripleOrder, true);
      }
    },
    [
      autoShiftEnd,
      clampBehavior,
      consumeOrClearProgrammaticSettle,
      emit,
      enforceRangeGap,
      maxGap,
      minGap,
      range.end,
      range.start,
      scrollHalf,
      tripleOrder,
      yMax,
      yMin,
    ]
  );

  const handleEndField = useCallback(
    (slot: 0 | 1 | 2, picked: number) => {
      const ix = (3 + slot) as 3 | 4 | 5;
      if (consumeOrClearProgrammaticSettle(ix, picked)) return;
      const field = tripleOrder[slot]!;
      let nextEnd: CalendarDateParts = { ...range.end };
      if (field === 'year') nextEnd.year = picked;
      else if (field === 'month') nextEnd.month = picked;
      else nextEnd.day = picked;
      nextEnd = clampPartsToYearRange(clampDateParts(nextEnd), yMin, yMax);

      const prevS = { ...range.start };
      const prevE = { ...range.end };
      const res = applyCalendarEndWheel(
        nextEnd,
        range.start,
        range.end,
        minGap,
        maxGap,
        clampBehavior,
        enforceRangeGap
      );
      if (res.lockReject) {
        scrollHalf(0, prevS, tripleOrder, true);
        scrollHalf(3, prevE, tripleOrder, true);
        return;
      }
      const changed =
        !partsEqual(res.start, prevS) || !partsEqual(res.end, prevE);
      if (changed) {
        emit(res, reasonEnd(res.constraint));
        scrollHalf(0, res.start, tripleOrder, true);
        scrollHalf(3, res.end, tripleOrder, true);
      }
    },
    [
      clampBehavior,
      consumeOrClearProgrammaticSettle,
      emit,
      enforceRangeGap,
      maxGap,
      minGap,
      range.end,
      range.start,
      scrollHalf,
      tripleOrder,
      yMax,
      yMin,
    ]
  );

  const visible = useMemo(() => {
    const v = Math.max(visibleItemCount, 3);
    return v % 2 === 0 ? v + 1 : v;
  }, [visibleItemCount]);

  const windowHeight = visible * rowHeight;

  const columnValueProps = useMemo(
    () => ({
      valueTextStyle,
      selectedValueTextStyle,
      valueCellStyle,
      selectedValueCellStyle: [
        styles.calendarWheelSelectedCell,
        selectedValueCellStyle,
      ] as StyleProp<ViewStyle>,
    }),
    [
      valueTextStyle,
      selectedValueTextStyle,
      valueCellStyle,
      selectedValueCellStyle,
    ]
  );

  const makeOnSettle = useCallback(
    (side: 'start' | 'end', slot: 0 | 1 | 2) =>
      (payload: PickerWheelSettledPayload) => {
        const raw = payload.value;
        const v =
          typeof raw === 'number'
            ? raw
            : typeof raw === 'string'
              ? Number(raw)
              : Number.NaN;
        if (!Number.isFinite(v)) return;
        if (side === 'start') handleStartField(slot, v);
        else handleEndField(slot, v);
      },
    [handleEndField, handleStartField]
  );

  const renderTriple = useCallback(
    (side: 'start' | 'end', baseRef: 0 | 3, parts: CalendarDateParts) => {
      return tripleOrder.map((field, slot) => {
        const ix = (baseRef + slot) as 0 | 1 | 2 | 3 | 4 | 5;
        let values: number[];
        let selected: number;
        let formatMonth: ((n: number) => string) | undefined;
        if (field === 'year') {
          values = years;
          selected = parts.year;
        } else if (field === 'month') {
          values = months;
          selected = parts.month;
          formatMonth = fmtMonth;
        } else {
          values = buildDayListFor(parts);
          selected = Math.min(parts.day, values[values.length - 1] ?? 1);
        }
        return (
          <View key={`${side}-${field}`} style={styles.segmentSixth}>
            <PickerColumn
              ref={refs[ix]!}
              values={values}
              selectedValue={selected}
              itemHeight={rowHeight}
              visibleItemCount={visible}
              formatValue={
                formatMonth != null
                  ? (v: DualPickerValue) =>
                      formatMonth(typeof v === 'number' ? v : Number(v))
                  : (v: DualPickerValue) => String(v)
              }
              onWheelSettled={makeOnSettle(side, slot as 0 | 1 | 2)}
              testID={`dual-picker-calendar-${side}-${field}`}
              {...columnValueProps}
            />
          </View>
        );
      });
    },
    [
      columnValueProps,
      fmtMonth,
      makeOnSettle,
      months,
      refs,
      rowHeight,
      tripleOrder,
      visible,
      years,
    ]
  );

  return (
    <View style={[styles.root, style, containerStyle]}>
      <View style={dateContentWrapperStyle}>
        {dateTitle != null ? (
          <View style={dateTitleWrapperStyle}>
            {typeof dateTitle === 'string' || typeof dateTitle === 'number' ? (
              <Text
                style={[styles.dateTitleText, dateTitleStyle]}
                {...(Platform.OS === 'android' && {
                  includeFontPadding: false,
                })}
              >
                {dateTitle}
              </Text>
            ) : (
              dateTitle
            )}
          </View>
        ) : null}

        <View style={[styles.headerRow, headerRowStyle]}>
          <Text
            style={[styles.labelCell, headerLabelStyle, headerLabelStartStyle]}
            {...(Platform.OS === 'android' && {
              includeFontPadding: false,
            })}
          >
            {startLabel}
          </Text>
          <View
            style={[
              styles.headerMidDivider,
              dateBetweenHalvesDividerStyle,
              dateBetweenHalvesDividerHeaderStyle,
            ]}
          />
          <Text
            style={[styles.labelCell, headerLabelStyle, headerLabelEndStyle]}
            {...(Platform.OS === 'android' && {
              includeFontPadding: false,
            })}
          >
            {endLabel}
          </Text>
        </View>

        <View style={[styles.fieldLabelStrip, dateFieldLabelsRowStyle]}>
          <View style={styles.halfRow}>
            {tripleOrder.map((field) => (
              <View key={`sf-${field}`} style={styles.segmentSixth}>
                <Text
                  style={[styles.subLabel, dateFieldCaptionTextStyle]}
                  {...(Platform.OS === 'android' && {
                    includeFontPadding: false,
                  })}
                >
                  {miniFieldLabel(field)}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={[
              styles.pickerMidDivider,
              dateBetweenHalvesDividerStyle,
              dateBetweenHalvesDividerFieldLabelsStyle,
            ]}
            pointerEvents="none"
          />
          <View style={styles.halfRow}>
            {tripleOrder.map((field) => (
              <View key={`ef-${field}`} style={styles.segmentSixth}>
                <Text
                  style={[styles.subLabel, dateFieldCaptionTextStyle]}
                  {...(Platform.OS === 'android' && {
                    includeFontPadding: false,
                  })}
                >
                  {miniFieldLabel(field)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.pickerChrome,
            pickerChromeStyle,
            dateWheelAreaStyle,
            dateWheelAreaBackgroundColor != null && {
              backgroundColor: dateWheelAreaBackgroundColor,
            },
            { height: windowHeight },
          ]}
        >
          <View style={[styles.pickerRow, { height: windowHeight }]}>
            <View style={styles.halfRow}>
              {renderTriple('start', 0, range.start)}
            </View>
            <View
              style={[
                styles.pickerMidDivider,
                dateBetweenHalvesDividerStyle,
                dateBetweenHalvesDividerWheelsStyle,
              ]}
              pointerEvents="none"
            />
            <View style={styles.halfRow}>
              {renderTriple('end', 3, range.end)}
            </View>
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.selectionOverlay,
              highlightBandStyle,
              dateSelectionLaneBackgroundColor != null && {
                backgroundColor: dateSelectionLaneBackgroundColor,
              },
              dateSelectionLaneStyle,
              {
                top: Math.floor((visible - 1) / 2) * rowHeight,
                height: rowHeight,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  dateTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    textAlign: 'center',
    marginBottom: 6,
  },
  headerRow: { flexDirection: 'row', marginBottom: 4 },
  labelCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#636366',
  },
  headerMidDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.29)',
  },
  fieldLabelStrip: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  pickerChrome: { position: 'relative', width: '100%', overflow: 'hidden' },
  pickerRow: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  halfRow: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  pickerMidDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(60, 60, 67, 0.29)',
  },
  segmentSixth: { flex: 1, alignSelf: 'stretch' },
  calendarWheelSelectedCell: {
    backgroundColor: 'transparent',
  },
  subLabel: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60, 60, 67, 0.29)',
    zIndex: 2,
  },
});
