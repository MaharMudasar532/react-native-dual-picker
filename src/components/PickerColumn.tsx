import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { DualPickerValue } from '../types';
import { datumEquals, datumIndexClosest } from '../utils/datum';
import { clampIndex } from '../utils/rangeUtils';

export type PickerColumnHandle = {
  scrollToOffset: (y: number, animated: boolean) => void;
};

/** Committed row after snap — use this for state (not `contentOffset`, which drifts with padding / OS). */
export type PickerWheelSettledPayload = {
  value: DualPickerValue;
  index: number;
  offsetY: number;
};

export type PickerColumnProps = {
  values: DualPickerValue[];
  selectedValue: DualPickerValue;
  itemHeight: number;
  visibleItemCount: number;
  formatValue?: (value: DualPickerValue) => string;
  onWheelSettled?: (payload: PickerWheelSettledPayload) => void;
  /** @deprecated Prefer `onWheelSettled` — not fired by `DualPicker`. */
  onMomentumScrollEnd?: (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => void;
  testID?: string;
  /** Inactive wheel row text */
  valueTextStyle?: StyleProp<TextStyle>;
  selectedValueTextStyle?: StyleProp<TextStyle>;
  /** Inactive wheel row container */
  valueCellStyle?: StyleProp<ViewStyle>;
  selectedValueCellStyle?: StyleProp<ViewStyle>;
  /** When `true` and `unit` is non-empty, show `unit` after each row’s formatted value. */
  showUnit?: boolean;
  unit?: string;
  unitTextStyle?: StyleProp<TextStyle>;
};

function defaultFormat(v: DualPickerValue): string {
  return String(v);
}

/** Same inset strategy as PaceBottomSheet `renderPickerColumn` — padding, not phantom rows */
function pickerPaddingPx(itemHeight: number, visibleItemCount: number): number {
  return (itemHeight * (visibleItemCount - 1)) / 2;
}

export const PickerColumn = forwardRef<PickerColumnHandle, PickerColumnProps>(
  function PickerColumn(
    {
      values,
      selectedValue,
      itemHeight,
      visibleItemCount,
      formatValue = defaultFormat,
      onWheelSettled,
      onMomentumScrollEnd,
      testID,
      valueTextStyle,
      selectedValueTextStyle,
      valueCellStyle,
      selectedValueCellStyle,
      showUnit,
      unit,
      unitTextStyle,
    },
    ref
  ) {
    const unitSuffix =
      showUnit && unit != null && String(unit).length > 0 ? String(unit) : null;
    const scrollRef = useRef<any>(null);
    const lastYRef = useRef(0);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draggingRef = useRef(false);

    const clearSettleTimer = useCallback(() => {
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        scrollToOffset(y: number, animated: boolean) {
          /** Cancel Android `scheduleSettleAfterDrag` — it calls `finalizeOffset(lastYRef)` and would undo this scroll. */
          clearSettleTimer();
          const maxY =
            values.length <= 0
              ? 0
              : Math.max(0, (values.length - 1) * itemHeight);
          const clamped = Math.min(maxY, Math.max(0, y));
          lastYRef.current = clamped;
          scrollRef.current?.scrollTo?.({ y: clamped, animated });
        },
      }),
      [clearSettleTimer, itemHeight, values.length]
    );

    useEffect(() => {
      return () => {
        if (settleTimerRef.current !== null) {
          clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
      };
    }, []);

    const viewportHeight = visibleItemCount * itemHeight;
    const pad = pickerPaddingPx(itemHeight, visibleItemCount);

    const hit = values.findIndex((v) => datumEquals(v, selectedValue));
    const selectedIndex =
      values.length === 0
        ? 0
        : hit >= 0
          ? hit
          : datumIndexClosest(values, selectedValue);

    /** Keep snapped offset aligned to `selectedValue` so committed row stays in the viewport center. */
    useLayoutEffect(() => {
      if (values.length <= 1) return;
      const maxY = Math.max(0, (values.length - 1) * itemHeight);
      const y = Math.min(maxY, Math.max(0, selectedIndex * itemHeight));
      lastYRef.current = y;
      scrollRef.current?.scrollTo?.({ y, animated: false });
    }, [itemHeight, selectedIndex, values.length]);

    const finalizeOffset = useCallback(
      (rawY: number, sourceEvent?: NativeSyntheticEvent<NativeScrollEvent>) => {
        const maxY =
          values.length <= 1
            ? 0
            : Math.max(0, (values.length - 1) * itemHeight);
        const stepped =
          values.length <= 1 ? 0 : Math.round(rawY / itemHeight) * itemHeight;
        const snapped = Math.min(maxY, Math.max(0, stepped));
        lastYRef.current = snapped;

        if (scrollRef.current && Math.abs(rawY - snapped) > 0.5) {
          scrollRef.current.scrollTo({ y: snapped, animated: false });
        }

        const idx =
          values.length === 0
            ? 0
            : values.length <= 1
              ? 0
              : clampIndex(Math.round(snapped / itemHeight), values.length - 1);
        const picked =
          values.length === 0 ? Number.NaN : (values[idx] ?? values[0]!);

        const pickCommitted =
          values.length > 0 &&
          (typeof picked === 'string' ||
            (typeof picked === 'number' && Number.isFinite(picked)));

        if (pickCommitted) {
          onWheelSettled?.({ value: picked, index: idx, offsetY: snapped });
        }

        /** Legacy escape hatch — `DualPicker` does not rely on offsets here */
        const evSource =
          sourceEvent ?? ({} as NativeSyntheticEvent<NativeScrollEvent>);
        onMomentumScrollEnd?.({
          ...evSource,
          nativeEvent: {
            ...evSource.nativeEvent,
            contentInset: evSource.nativeEvent?.contentInset ?? {
              bottom: pad,
              top: pad,
              left: 0,
              right: 0,
            },
            contentOffset: {
              x: evSource.nativeEvent?.contentOffset?.x ?? 0,
              y: snapped,
            },
            contentSize: evSource.nativeEvent?.contentSize ?? {
              height: 0,
              width: 0,
            },
            layoutMeasurement: evSource.nativeEvent?.layoutMeasurement ?? {
              height: viewportHeight,
              width: 0,
            },
            zoomScale: evSource.nativeEvent?.zoomScale ?? 1,
          },
        });
      },
      [
        itemHeight,
        onMomentumScrollEnd,
        onWheelSettled,
        pad,
        values,
        viewportHeight,
      ]
    );

    const scheduleSettleAfterDrag = useCallback(() => {
      clearSettleTimer();
      settleTimerRef.current = setTimeout(
        () => {
          settleTimerRef.current = null;
          if (!draggingRef.current && scrollRef.current) {
            finalizeOffset(lastYRef.current);
          }
        },
        Platform.OS === 'android' ? 120 : 80
      );
    }, [clearSettleTimer, finalizeOffset]);

    const handleMomentumScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        clearSettleTimer();
        draggingRef.current = false;
        const raw = event.nativeEvent.contentOffset.y;
        finalizeOffset(raw, event);
      },
      [clearSettleTimer, finalizeOffset]
    );

    return (
      <View style={styles.wrapper} testID={testID}>
        <ScrollView
          ref={scrollRef}
          style={[styles.scrollViewport, { height: viewportHeight }]}
          showsVerticalScrollIndicator={false}
          snapToInterval={values.length <= 1 ? undefined : itemHeight}
          decelerationRate="fast"
          nestedScrollEnabled
          scrollEventThrottle={16}
          directionalLockEnabled
          onScroll={(e) => {
            lastYRef.current = e.nativeEvent.contentOffset.y;
          }}
          onScrollBeginDrag={() => {
            draggingRef.current = true;
            clearSettleTimer();
          }}
          onScrollEndDrag={() => {
            draggingRef.current = false;
            scheduleSettleAfterDrag();
          }}
          onMomentumScrollBegin={() => {
            /** Fling follows drag — cancel deferred settle until momentum completes */
            clearSettleTimer();
          }}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: pad,
            paddingBottom: pad,
          }}
        >
          {values.map((raw, index) => {
            const selected = index === selectedIndex;
            return (
              <View
                key={`${String(raw)}-${index}`}
                style={[
                  styles.item,
                  valueCellStyle,
                  { height: itemHeight },
                  selected && styles.itemSelected,
                  selected && selectedValueCellStyle,
                ]}
              >
                {unitSuffix != null ? (
                  <View style={styles.itemLabelRow}>
                    <Text
                      style={[
                        styles.itemText,
                        valueTextStyle,
                        selected && [
                          styles.itemTextSelected,
                          selectedValueTextStyle,
                        ],
                      ]}
                      {...(Platform.OS === 'android' && {
                        includeFontPadding: false,
                      })}
                    >
                      {formatValue(raw)}
                    </Text>
                    <Text
                      style={[
                        styles.itemUnitText,
                        selected && styles.itemUnitTextSelected,
                        unitTextStyle,
                      ]}
                      {...(Platform.OS === 'android' && {
                        includeFontPadding: false,
                      })}
                    >
                      {'\u2009'}
                      {unitSuffix}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.itemText,
                      valueTextStyle,
                      selected && [
                        styles.itemTextSelected,
                        selectedValueTextStyle,
                      ],
                    ]}
                    {...(Platform.OS === 'android' && {
                      includeFontPadding: false,
                    })}
                  >
                    {formatValue(raw)}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  scrollViewport: {
    backgroundColor: 'transparent',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    maxWidth: '100%',
    paddingHorizontal: 2,
  },
  itemUnitText: {
    fontSize: 13,
    color: '#AEAEB2',
    fontWeight: '500',
  },
  itemUnitTextSelected: {
    fontSize: 14,
    color: '#636366',
    fontWeight: '600',
  },
  itemSelected: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 0,
  },
  itemText: {
    fontSize: 17,
    color: '#8E8E93',
    letterSpacing: 0,
  },
  itemTextSelected: {
    fontSize: 20,
    color: '#000',
    letterSpacing: 0,
    /** `600` is easy to mistake for regular on small caps — `700`/`bold` reads clearly in wheel pickers. */
    fontWeight: Platform.select({
      ios: '700',
      android: 'bold',
      default: '700',
    }),
  },
});
