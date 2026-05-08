import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  CalendarDateParts,
  DualPickerCalendarRange,
  DualPickerCalendarRangeInput,
  DualPickerChangeReason,
  DualPickerDateFormat,
  DualPickerMode,
  DualPickerModeOptions,
  DualPickerPresentation,
  DualPickerRange,
} from 'react-native-dual-picker';
import {
  DualPicker,
  normalizeDualPickerCalendarValue,
} from 'react-native-dual-picker';

const NUMERIC_DATA = Array.from({ length: 41 }, (_, i) => i + 5);

type PresetId =
  | 'range'
  | 'alphabet'
  | 'decimal'
  | 'month'
  | 'day'
  | 'weekday'
  | 'year'
  | 'date';

type DualPickerCombinedRange =
  | DualPickerRange
  | DualPickerCalendarRange
  | DualPickerCalendarRangeInput;

type PresetConfig = {
  id: PresetId;
  label: string;
  mode: DualPickerMode;
  /** For `range` only */
  data?: number[];
  modeOptions?: DualPickerModeOptions;
  initial: DualPickerCombinedRange;
};

function isCalendarPickerValue(
  v: DualPickerCombinedRange
): v is DualPickerCalendarRange | DualPickerCalendarRangeInput {
  return (
    typeof v.start === 'object' &&
    v.start !== null &&
    typeof v.end === 'object' &&
    v.end !== null
  );
}

function presetMaxGap(m: DualPickerMode): number {
  if (m === 'range') return 12;
  if (m === 'alphabet') return 10;
  if (m === 'decimal') return 8;
  if (m === 'date') return 400;
  return 24;
}

function maxGapForMode(mode: DualPickerMode): number {
  return presetMaxGap(mode);
}

type AppDualPickerProps = {
  active: PresetConfig;
  activeModeOpts: DualPickerModeOptions | undefined;
  value: DualPickerCombinedRange;
  onValueChange: (
    next: DualPickerCombinedRange,
    meta?: { reason: DualPickerChangeReason }
  ) => void;
  pickerWidth: number;
  presetId: PresetId;
  wrapStyle?: StyleProp<ViewStyle>;
  presentation?: DualPickerPresentation;
  sheetVisible?: boolean;
  onSheetVisibleChange?: (visible: boolean) => void;
};

function AppDualPicker({
  active,
  activeModeOpts,
  value,
  onValueChange,
  pickerWidth,
  presetId,
  wrapStyle,
  presentation = 'inline',
  sheetVisible,
  onSheetVisibleChange,
}: AppDualPickerProps) {
  const dateExtras =
    active.mode === 'date'
      ? {
          dateTitle: 'Customize via date* props',
          dateTitleStyle: styles.datePickerTitleText,
          dateTitleWrapperStyle: styles.datePickerTitleWrap,
          dateContentWrapperStyle: styles.datePickerInnerBox,
          dateWheelAreaBackgroundColor: '#F5F5F7',
          dateBetweenHalvesDividerStyle: styles.datePickerBetweenDivider,
          dateSelectionLaneBackgroundColor: 'rgba(0, 122, 255, 0.1)',
          dateSelectionLaneStyle: styles.datePickerSelectionLane,
          dateFieldCaptionTextStyle: styles.datePickerCaption,
          valueTextStyle: styles.datePickerValueIdle,
          selectedValueTextStyle: styles.datePickerValueSelected,
          headerLabelStartStyle: styles.datePickerHeaderStart,
          headerLabelEndStyle: styles.datePickerHeaderEnd,
        }
      : {};

  const sheetChrome =
    presentation === 'sheet'
      ? {
          sheetTitle: 'Bottom sheet',
          sheetTitleStyle: styles.sheetTitleText,
          sheetCardStyle: styles.sheetCard,
          sheetBackdropStyle: styles.sheetBackdrop,
          sheetPickerWrapperStyle: styles.sheetPickerWrapper,
        }
      : {};

  const pickerEl = (
    <DualPicker
      key={presetId}
      mode={active.mode}
      modeOptions={activeModeOpts}
      clampBehavior="push-end"
      autoShiftEnd
      data={active.data}
      minGap={1}
      maxGap={maxGapForMode(active.mode)}
      value={value}
      startLabel="From"
      endLabel="To"
      headerLabelStyle={styles.pickerHeaderLabel}
      presentation={presentation}
      sheetVisible={sheetVisible}
      onSheetVisibleChange={onSheetVisibleChange}
      onChange={(next, meta) => {
        onValueChange(next as DualPickerCombinedRange, meta);
      }}
      formatValue={(v) => String(v)}
      {...dateExtras}
      {...sheetChrome}
    />
  );

  if (presentation === 'sheet') {
    return pickerEl;
  }

  return (
    <View style={[styles.pickerWrap, { maxWidth: pickerWidth }, wrapStyle]}>
      {pickerEl}
    </View>
  );
}

function formatCalendarPartsLabel(p: CalendarDateParts): string {
  const d = Date.UTC(p.year, p.month - 1, p.day);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

function diffCalendarDaysInclusive(
  start: CalendarDateParts,
  end: CalendarDateParts
): number {
  const a = Date.UTC(start.year, start.month - 1, start.day);
  const b = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((b - a) / 86400000);
}

const PRESETS: PresetConfig[] = [
  {
    id: 'range',
    label: 'Numbers',
    mode: 'range',
    data: NUMERIC_DATA,
    initial: { start: 10, end: 18 },
  },
  {
    id: 'alphabet',
    label: 'A–Z',
    mode: 'alphabet',
    initial: { start: 'a', end: 'f' },
  },
  {
    id: 'decimal',
    label: 'Floats',
    mode: 'decimal',
    modeOptions: { decimalFrom: 0, decimalTo: 2, decimalStep: 0.1 },
    initial: { start: 0, end: 0.5 },
  },
  {
    id: 'month',
    label: 'Month',
    mode: 'month',
    modeOptions: { monthStyle: 'number' },
    initial: { start: 3, end: 9 },
  },
  {
    id: 'day',
    label: 'Day',
    mode: 'day',
    modeOptions: { dayFrom: 1, dayTo: 31 },
    initial: { start: 5, end: 18 },
  },
  {
    id: 'weekday',
    label: 'Weekday',
    mode: 'weekday',
    modeOptions: { weekdayStyle: 'number', weekdayFirstDay: 1 },
    initial: { start: 1, end: 5 },
  },
  {
    id: 'year',
    label: 'Years',
    mode: 'year',
    modeOptions: {
      yearFrom: new Date().getFullYear() - 5,
      yearTo: new Date().getFullYear() + 6,
    },
    initial: {
      start: new Date().getFullYear(),
      end: new Date().getFullYear() + 3,
    },
  },
  {
    id: 'date',
    label: 'Date (calendar)',
    mode: 'date',
    modeOptions: {
      dateFormat: 'iso',
      monthStyle: 'short',
      yearFrom: new Date().getFullYear() - 20,
      yearTo: new Date().getFullYear() + 5,
    },
    initial: {
      start: {},
      end: {},
    },
  },
];

const firstPreset = PRESETS[0]!;

export default function App() {
  const { width } = useWindowDimensions();
  const pickerWidth = Math.min(width - 32, 400);

  const [presetId, setPresetId] = useState<PresetId>('range');
  const active = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? firstPreset,
    [presetId]
  );

  const [value, setValue] = useState<DualPickerCombinedRange>(
    () => firstPreset.initial
  );
  const [reason, setReason] = useState<DualPickerChangeReason | undefined>();
  const [dateFormat, setDateFormat] = useState<DualPickerDateFormat>('iso');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    const p = PRESETS.find((x) => x.id === presetId) ?? firstPreset;
    setValue(p.initial);
    const df = p.modeOptions?.dateFormat;
    if (p.mode === 'date' && df) setDateFormat(df);
  }, [presetId]);

  const activeModeOpts = useMemo((): DualPickerModeOptions | undefined => {
    if (active.mode !== 'date') return active.modeOptions;
    const base = active.modeOptions ?? {};
    if ((base.dateFormat ?? 'iso') === dateFormat) return active.modeOptions;
    return { ...base, dateFormat };
  }, [active.mode, active.modeOptions, dateFormat]);

  const calendarCanonForUi = useMemo(() => {
    if (active.mode !== 'date' || !isCalendarPickerValue(value)) return null;
    return normalizeDualPickerCalendarValue(
      value,
      activeModeOpts,
      1,
      presetMaxGap('date')
    );
  }, [active.mode, activeModeOpts, value]);

  const gapReadout = useMemo(() => {
    if (calendarCanonForUi) {
      return `${diffCalendarDaysInclusive(
        calendarCanonForUi.start,
        calendarCanonForUi.end
      )} UTC days`;
    }
    if (typeof value.start === 'number' && typeof value.end === 'number') {
      return String(value.end - value.start);
    }
    return '— (string / index)';
  }, [calendarCanonForUi, value]);

  const onPickerChange = (
    next: DualPickerCombinedRange,
    meta?: { reason: DualPickerChangeReason }
  ) => {
    setValue(next);
    setReason(meta?.reason);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.title}>Dual picker — modes</Text>
        <Text style={styles.blurb}>
          Choose a preset: numbers, letters, floats, calendar date range (Y/M/D
          wheels — pick <Text style={styles.mono}>dateFormat</Text>: iso / eu /
          us), day of month, months, weekdays, or years. Gap rules use numeric
          spacing for number wheels and <Text style={styles.mono}>index</Text>{' '}
          steps for text labels; for <Text style={styles.mono}>date</Text> mode
          gaps count whole UTC days. Partial calendar{' '}
          <Text style={styles.mono}>value</Text> halves (omit y/m/d) default
          from <Text style={styles.mono}>modeOptions.defaultCalendar*</Text>,
          then today&apos;s local date — day lengths follow each resolved month.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          nestedScrollEnabled
        >
          {PRESETS.map((p) => {
            const sel = p.id === presetId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPresetId(p.id)}
                style={[styles.chip, sel && styles.chipSelected]}
              >
                <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {active.mode === 'date' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            nestedScrollEnabled
          >
            {(['iso', 'eu', 'us'] as const).map((f) => {
              const sel = f === dateFormat;
              const labels: Record<DualPickerDateFormat, string> = {
                iso: 'ISO (Y‑M‑D)',
                eu: 'EU (D‑M‑Y)',
                us: 'US (M‑D‑Y)',
              };
              return (
                <Pressable
                  key={f}
                  onPress={() => setDateFormat(f)}
                  style={[styles.chip, sel && styles.chipSelected]}
                >
                  <Text
                    style={[styles.chipText, sel && styles.chipTextSelected]}
                  >
                    {labels[f]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <AppDualPicker
          active={active}
          activeModeOpts={activeModeOpts}
          value={value}
          onValueChange={onPickerChange}
          pickerWidth={pickerWidth}
          presetId={presetId}
        />

        <View style={styles.readout}>
          <Text style={styles.readoutLine}>
            <Text style={styles.label}>mode</Text>{' '}
            <Text style={styles.mono}>{active.mode}</Text>
          </Text>
          <Text style={styles.readoutLine}>
            <Text style={styles.label}>start</Text>{' '}
            <Text style={styles.mono}>
              {calendarCanonForUi
                ? formatCalendarPartsLabel(calendarCanonForUi.start)
                : String(value.start)}
            </Text>
          </Text>
          <Text style={styles.readoutLine}>
            <Text style={styles.label}>end</Text>{' '}
            <Text style={styles.mono}>
              {calendarCanonForUi
                ? formatCalendarPartsLabel(calendarCanonForUi.end)
                : String(value.end)}
            </Text>
          </Text>
          <Text style={styles.readoutLine}>
            <Text style={styles.label}>Δ (gap)</Text>{' '}
            <Text style={styles.mono}>{gapReadout}</Text>
          </Text>
          <Text style={styles.readoutLine}>
            <Text style={styles.label}>last change</Text>{' '}
            <Text style={styles.mono}>{reason ?? '—'}</Text>
          </Text>
        </View>

        <Pressable
          style={styles.openBottomButton}
          onPress={() => setBottomSheetOpen(true)}
        >
          <Text style={styles.openBottomButtonText}>
            Open same picker from bottom (sheet)
          </Text>
        </Pressable>
      </ScrollView>

      <AppDualPicker
        active={active}
        activeModeOpts={activeModeOpts}
        value={value}
        onValueChange={onPickerChange}
        pickerWidth={pickerWidth}
        presetId={presetId}
        presentation="sheet"
        sheetVisible={bottomSheetOpen}
        onSheetVisibleChange={setBottomSheetOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  blurb: {
    fontSize: 15,
    color: '#3C3C43',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 14,
    maxWidth: 360,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 420,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  pickerHeaderLabel: {
    color: '#3C3C43',
    letterSpacing: 0.5,
  },
  datePickerTitleWrap: {
    paddingBottom: 4,
  },
  datePickerTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  datePickerInnerBox: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  datePickerBetweenDivider: {
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: '#C7C7CC',
    marginVertical: 0,
  },
  datePickerSelectionLane: {
    borderColor: '#007AFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerCaption: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '700',
  },
  datePickerValueIdle: {
    fontSize: 16,
    color: '#AEAEB2',
  },
  datePickerValueSelected: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  datePickerHeaderStart: {
    color: '#007AFF',
  },
  datePickerHeaderEnd: {
    color: '#5856D6',
  },
  pickerWrap: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  readout: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    alignSelf: 'center',
  },
  readoutLine: {
    fontSize: 16,
    color: '#000',
  },
  label: {
    fontWeight: '600',
    color: '#636366',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  mono: {
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '600',
  },
  openBottomButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
    maxWidth: 400,
    width: '100%',
  },
  openBottomButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  /** Example-only overrides for `DualPicker` `sheet*` props */
  sheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetCard: {
    backgroundColor: '#E8E8ED',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetPickerWrapper: {
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  sheetTitleText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    color: '#1C1C1E',
  },
});
