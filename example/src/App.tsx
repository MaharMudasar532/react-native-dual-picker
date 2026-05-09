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
          dateSelectionLaneBackgroundColor: 'rgba(15, 23, 42, 0.06)',
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
          sheetHeaderRowStyle: styles.sheetHeaderRow,
          sheetCardStyle: styles.sheetCard,
          sheetBackdropStyle: styles.sheetBackdrop,
          sheetPickerWrapperStyle: styles.sheetPickerWrapper,
          sheetCloseButtonStyle: styles.sheetCloseButton,
          sheetCloseIconStyle: styles.sheetCloseIcon,
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

  const [sheetPresetId, setSheetPresetId] = useState<PresetId>('range');
  const sheetActive = useMemo(
    () => PRESETS.find((p) => p.id === sheetPresetId) ?? firstPreset,
    [sheetPresetId]
  );
  const [sheetValue, setSheetValue] = useState<DualPickerCombinedRange>(
    () => firstPreset.initial
  );
  const [sheetReason, setSheetReason] = useState<
    DualPickerChangeReason | undefined
  >();
  const [sheetDateFormat, setSheetDateFormat] =
    useState<DualPickerDateFormat>('iso');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  useEffect(() => {
    const p = PRESETS.find((x) => x.id === presetId) ?? firstPreset;
    setValue(p.initial);
    const df = p.modeOptions?.dateFormat;
    if (p.mode === 'date' && df) setDateFormat(df);
  }, [presetId]);

  useEffect(() => {
    const p = PRESETS.find((x) => x.id === sheetPresetId) ?? firstPreset;
    setSheetValue(p.initial);
    const df = p.modeOptions?.dateFormat;
    if (p.mode === 'date' && df) setSheetDateFormat(df);
  }, [sheetPresetId]);

  const activeModeOpts = useMemo((): DualPickerModeOptions | undefined => {
    if (active.mode !== 'date') return active.modeOptions;
    const base = active.modeOptions ?? {};
    if ((base.dateFormat ?? 'iso') === dateFormat) return active.modeOptions;
    return { ...base, dateFormat };
  }, [active.mode, active.modeOptions, dateFormat]);

  const sheetActiveModeOpts = useMemo((): DualPickerModeOptions | undefined => {
    if (sheetActive.mode !== 'date') return sheetActive.modeOptions;
    const base = sheetActive.modeOptions ?? {};
    if ((base.dateFormat ?? 'iso') === sheetDateFormat) {
      return sheetActive.modeOptions;
    }
    return { ...base, dateFormat: sheetDateFormat };
  }, [sheetActive.mode, sheetActive.modeOptions, sheetDateFormat]);

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

  const onSheetPickerChange = (
    next: DualPickerCombinedRange,
    meta?: { reason: DualPickerChangeReason }
  ) => {
    setSheetValue(next);
    setSheetReason(meta?.reason);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.title}>Dual picker examples</Text>
        <Text style={styles.blurb}>
          Two sections below: an inline picker and a bottom-sheet picker. Try
          all modes from the chips/buttons.
        </Text>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Without sheet (inline)</Text>
          <Text style={styles.sectionNote}>
            Embedded directly in the page layout.
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
                  <Text
                    style={[styles.chipText, sel && styles.chipTextSelected]}
                  >
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
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Bottom sheet (all modes)</Text>
          <Text style={styles.sectionNote}>
            Tap any mode to open it in the sheet.
          </Text>
          <View style={styles.sheetTypeGrid}>
            {PRESETS.map((p) => {
              const isActive = p.id === sheetPresetId;
              return (
                <Pressable
                  key={`sheet-${p.id}`}
                  style={[
                    styles.sheetTypeButton,
                    isActive && styles.sheetTypeButtonActive,
                  ]}
                  onPress={() => {
                    setSheetPresetId(p.id);
                    setBottomSheetOpen(true);
                  }}
                >
                  <Text
                    style={[
                      styles.sheetTypeText,
                      isActive && styles.sheetTypeTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.readout}>
            <Text style={styles.readoutLine}>
              <Text style={styles.label}>sheet mode</Text>{' '}
              <Text style={styles.mono}>{sheetActive.mode}</Text>
            </Text>
            <Text style={styles.readoutLine}>
              <Text style={styles.label}>last change</Text>{' '}
              <Text style={styles.mono}>{sheetReason ?? '—'}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <AppDualPicker
        active={sheetActive}
        activeModeOpts={sheetActiveModeOpts}
        value={sheetValue}
        onValueChange={onSheetPickerChange}
        pickerWidth={pickerWidth}
        presetId={sheetPresetId}
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
    paddingHorizontal: 18,
    paddingTop: 40,
    paddingBottom: 28,
    alignItems: 'center',
    backgroundColor: '#F7F7FA',
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.45,
    marginBottom: 10,
  },
  blurb: {
    fontSize: 14,
    color: '#5B6472',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
    maxWidth: 390,
  },
  sectionBlock: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3E6ED',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  sectionNote: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    maxWidth: 420,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6DCE8',
    backgroundColor: '#F8FAFC',
  },
  chipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#F8FAFC',
  },
  pickerHeaderLabel: {
    color: '#4B5563',
    letterSpacing: 0.35,
    fontWeight: '600',
  },
  datePickerTitleWrap: {
    paddingBottom: 4,
  },
  datePickerTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  datePickerInnerBox: {
    paddingHorizontal: 6,
    paddingBottom: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  datePickerBetweenDivider: {
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: '#C7C7CC',
    marginVertical: 0,
  },
  datePickerSelectionLane: {
    borderColor: 'rgba(15, 23, 42, 0.16)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerCaption: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '700',
  },
  datePickerValueIdle: {
    fontSize: 17,
    color: '#9CA3AF',
  },
  datePickerValueSelected: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  readout: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 7,
    alignSelf: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  readoutLine: {
    fontSize: 15,
    color: '#111827',
  },
  label: {
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.7,
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
  sheetTypeGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sheetTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D6DCE8',
    backgroundColor: '#F8FAFC',
  },
  sheetTypeButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  sheetTypeText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetTypeTextActive: {
    color: '#F8FAFC',
  },
  openBottomButton: {
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheetHeaderRow: {
    paddingTop: 2,
    paddingBottom: 12,
    paddingHorizontal: 14,
  },
  sheetCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDE3EE',
  },
  sheetPickerWrapper: {
    paddingHorizontal: 10,
    marginBottom: 8,
    paddingTop: 4,
  },
  sheetCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2F7',
    marginTop: -6,
  },
  sheetCloseIcon: {
    color: '#475569',
    fontSize: 17,
    fontWeight: '400',
  },
  sheetTitleText: {
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.28,
    color: '#111827',
    marginTop: 0,
  },
});
