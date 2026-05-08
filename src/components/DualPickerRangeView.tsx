import { useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useDualPicker } from '../hooks/useDualPicker';
import type { DualPickerProps, DualPickerRange } from '../types';
import { normalizeExternalPair } from '../utils/externalPair';
import {
  PickerColumn,
  type PickerColumnHandle,
  type PickerWheelSettledPayload,
} from './PickerColumn';

const DEFAULT_VISIBLE = 5;

/** Two-column picker for every [`DualPickerMode`](/) except **`"date"`** (handled by [`DualPickerCalendar`](./DualPickerCalendar.tsx)). */
export function DualPickerRangeView(props: DualPickerProps) {
  const {
    mode,
    modeOptions,
    gapBasis,
    data,
    clampBehavior,
    autoShiftEnd,
    minGap,
    maxGap,
    enforceRangeGap = true,
    step,
    formatValue,
    value,
    onChange,
    itemHeight,
    visibleItemCount = DEFAULT_VISIBLE,
    style,
    containerStyle,
    startColumnWrapperStyle,
    endColumnWrapperStyle,
    startLabel = 'START',
    endLabel = 'END',
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
    dualWheelDividerStyle,
    dualWheelWheelAreaStyle,
    dualWheelWheelAreaBackgroundColor,
    dualWheelSelectionLaneStyle,
    dualWheelSelectionLaneBackgroundColor,
    dualWheelStartSelectedTextStyle,
    dualWheelEndSelectedTextStyle,
    dualWheelStartSelectedCellStyle,
    dualWheelEndSelectedCellStyle,
  } = props;

  const vr = value as DualPickerRange;

  if (__DEV__ && mode === 'dual') {
    console.warn(
      '[DualPicker] `mode="dual"` is deprecated; prefer `mode="range"`.'
    );
  }

  const startRef = useRef<PickerColumnHandle>(null);
  const endRef = useRef<PickerColumnHandle>(null);

  const {
    sorted,
    range,
    itemHeight: rowHeight,
    resolvedGapBasis,
    commitStartWheel,
    commitEndWheel,
    scrollBothToControlled,
  } = useDualPicker({
    mode,
    modeOptions,
    gapBasis,
    data,
    value: vr,
    onChange,
    minGap,
    maxGap,
    enforceRangeGap,
    step,
    itemHeight,
    clampBehavior,
    autoShiftEnd,
  });

  const lastSyncedRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const normalized = normalizeExternalPair(
      sorted,
      resolvedGapBasis,
      vr.start,
      vr.end,
      minGap,
      maxGap,
      enforceRangeGap
    );
    const key = JSON.stringify({
      start: normalized.start,
      end: normalized.end,
      sorted,
      gap: resolvedGapBasis,
    });
    if (lastSyncedRef.current === key) return;
    lastSyncedRef.current = key;
    scrollBothToControlled(
      (y, animated) => startRef.current?.scrollToOffset(y, animated),
      (y, animated) => endRef.current?.scrollToOffset(y, animated),
      false
    );
  }, [
    enforceRangeGap,
    maxGap,
    minGap,
    resolvedGapBasis,
    scrollBothToControlled,
    sorted,
    vr.end,
    vr.start,
  ]);

  const handleStartWheelSettled = useCallback(
    (payload: PickerWheelSettledPayload) =>
      commitStartWheel(
        payload.value,
        (y, animated) => endRef.current?.scrollToOffset(y, animated),
        (y, animated) => startRef.current?.scrollToOffset(y, animated)
      ),
    [commitStartWheel]
  );

  const handleEndWheelSettled = useCallback(
    (payload: PickerWheelSettledPayload) =>
      commitEndWheel(
        payload.value,
        (y, animated) => endRef.current?.scrollToOffset(y, animated),
        (y, animated) => startRef.current?.scrollToOffset(y, animated)
      ),
    [commitEndWheel]
  );

  const visible = useMemo(() => {
    const v = Math.max(visibleItemCount, 3);
    return v % 2 === 0 ? v + 1 : v;
  }, [visibleItemCount]);

  const windowHeight = visible * rowHeight;

  const startColumnProps = useMemo(
    () => ({
      valueTextStyle,
      selectedValueTextStyle: [
        selectedValueTextStyle,
        dualWheelStartSelectedTextStyle,
      ] as StyleProp<TextStyle>,
      valueCellStyle,
      selectedValueCellStyle: [
        styles.dualWheelTransparentSelectedCell,
        selectedValueCellStyle,
        dualWheelStartSelectedCellStyle,
      ] as StyleProp<ViewStyle>,
    }),
    [
      dualWheelStartSelectedCellStyle,
      dualWheelStartSelectedTextStyle,
      selectedValueCellStyle,
      selectedValueTextStyle,
      valueCellStyle,
      valueTextStyle,
    ]
  );

  const endColumnProps = useMemo(
    () => ({
      valueTextStyle,
      selectedValueTextStyle: [
        selectedValueTextStyle,
        dualWheelEndSelectedTextStyle,
      ] as StyleProp<TextStyle>,
      valueCellStyle,
      selectedValueCellStyle: [
        styles.dualWheelTransparentSelectedCell,
        selectedValueCellStyle,
        dualWheelEndSelectedCellStyle,
      ] as StyleProp<ViewStyle>,
    }),
    [
      dualWheelEndSelectedCellStyle,
      dualWheelEndSelectedTextStyle,
      selectedValueCellStyle,
      selectedValueTextStyle,
      valueCellStyle,
      valueTextStyle,
    ]
  );

  const centerRowTop = Math.floor((visible - 1) / 2) * rowHeight;

  return (
    <View style={[styles.root, style, containerStyle]}>
      <View style={[styles.headerRow, headerRowStyle]}>
        <Text
          style={[styles.labelCell, headerLabelStyle, headerLabelStartStyle]}
          {...(Platform.OS === 'android' && { includeFontPadding: false })}
        >
          {startLabel}
        </Text>
        <Text
          style={[styles.labelCell, headerLabelStyle, headerLabelEndStyle]}
          {...(Platform.OS === 'android' && { includeFontPadding: false })}
        >
          {endLabel}
        </Text>
      </View>

      <View
        style={[
          styles.pickerChrome,
          pickerChromeStyle,
          dualWheelWheelAreaStyle,
          dualWheelWheelAreaBackgroundColor != null && {
            backgroundColor: dualWheelWheelAreaBackgroundColor,
          },
          { height: windowHeight },
        ]}
      >
        <View style={[styles.pickerRow, { height: windowHeight }]}>
          <View style={[styles.segment, startColumnWrapperStyle]}>
            <PickerColumn
              ref={startRef}
              values={sorted}
              selectedValue={range.start}
              itemHeight={rowHeight}
              visibleItemCount={visible}
              formatValue={formatValue}
              onWheelSettled={handleStartWheelSettled}
              testID="dual-picker-start"
              {...startColumnProps}
            />
          </View>
          <View
            style={[styles.dualWheelDivider, dualWheelDividerStyle]}
            pointerEvents="none"
          />
          <View style={[styles.segment, endColumnWrapperStyle]}>
            <PickerColumn
              ref={endRef}
              values={sorted}
              selectedValue={range.end}
              itemHeight={rowHeight}
              visibleItemCount={visible}
              formatValue={formatValue}
              onWheelSettled={handleEndWheelSettled}
              testID="dual-picker-end"
              {...endColumnProps}
            />
          </View>
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.selectionOverlayLane,
            highlightBandStyle,
            dualWheelSelectionLaneBackgroundColor != null && {
              backgroundColor: dualWheelSelectionLaneBackgroundColor,
            },
            dualWheelSelectionLaneStyle,
            { top: centerRowTop, height: rowHeight },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  labelCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#636366',
  },
  pickerChrome: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  pickerRow: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  segment: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  dualWheelDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(60, 60, 67, 0.29)',
  },
  dualWheelTransparentSelectedCell: {
    backgroundColor: 'transparent',
  },
  selectionOverlayLane: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60, 60, 67, 0.29)',
    zIndex: 2,
  },
});
