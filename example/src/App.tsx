import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  CalendarDateParts,
  DualPickerCalendarRange,
  DualPickerCalendarRangeInput,
  DualPickerChangeReason,
  DualPickerColorScheme,
  DualPickerDateFormat,
  DualPickerMode,
  DualPickerModeOptions,
  DualPickerPresentation,
  DualPickerRange,
  DualPickerValue,
} from 'react-native-dual-picker';
import {
  DualPicker,
  formatDualPickerTimeMinutes,
  normalizeDualPickerCalendarValue,
} from 'react-native-dual-picker';

const NUMERIC_DATA = Array.from({ length: 41 }, (_, i) => i + 5);

/** Custom string list: `mode="range"` with string `data` uses index-based `minGap` / `maxGap`. */
const CITY_DATA: string[] = [
  'London',
  'Paris',
  'Tokyo',
  'Sydney',
  'Dubai',
  'New York',
  'Berlin',
  'Madrid',
  'Rome',
  'Singapore',
];

type PresetId =
  | 'range'
  | 'cities'
  | 'alphabet'
  | 'decimal'
  | 'month'
  | 'day'
  | 'weekday'
  | 'year'
  | 'time'
  | 'date';

type DualPickerCombinedRange =
  | DualPickerRange
  | DualPickerCalendarRange
  | DualPickerCalendarRangeInput;

type PresetConfig = {
  id: PresetId;
  label: string;
  mode: DualPickerMode;
  /** For `range` / `dual`: numbers or strings (not mixed) */
  data?: DualPickerValue[];
  modeOptions?: DualPickerModeOptions;
  initial: DualPickerCombinedRange;
  showUnit?: boolean;
  unit?: string;
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

function presetMaxGap(id: PresetId, m: DualPickerMode): number {
  if (id === 'cities') return 6;
  if (m === 'range') return 12;
  if (m === 'alphabet') return 10;
  if (m === 'decimal') return 8;
  if (m === 'time') return 480;
  /** Calendar mode: gap is whole UTC days between start and end (`maxGap` / `minGap`). */
  if (m === 'date') return 3650;
  return 24;
}

function formatWheelReadout(
  mode: DualPickerMode,
  v: DualPickerCombinedRange['start'],
  modeOpts: DualPickerModeOptions | undefined,
  timeUse12Hour?: boolean
): string {
  if (mode === 'time' && typeof v === 'number') {
    const use12 =
      timeUse12Hour !== undefined ? timeUse12Hour : !!modeOpts?.timeUse12Hour;
    return formatDualPickerTimeMinutes(v, use12);
  }
  return String(v);
}

function maxGapForPreset(id: PresetId, mode: DualPickerMode): number {
  return presetMaxGap(id, mode);
}

type AppDualPickerProps = {
  active: PresetConfig;
  activeModeOpts: DualPickerModeOptions | undefined;
  /** Passed as `DualPicker` `timeUse12Hour` when `mode="time"`. */
  timeUse12Hour?: boolean;
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
  /** Passed through to library `DualPicker` (e.g. `'system'` for sheet + device theme). */
  colorScheme?: DualPickerColorScheme;
};

function AppDualPicker({
  active,
  activeModeOpts,
  timeUse12Hour,
  value,
  onValueChange,
  pickerWidth,
  presetId,
  wrapStyle,
  presentation = 'inline',
  sheetVisible,
  onSheetVisibleChange,
  colorScheme,
}: AppDualPickerProps) {
  const deviceScheme = useColorScheme();
  const sheetUsesDarkChrome =
    colorScheme === 'dark' ||
    (colorScheme === 'system' && deviceScheme === 'dark');

  const dateExtras =
    active.mode === 'date' && !sheetUsesDarkChrome
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
      : active.mode === 'date'
        ? {}
        : {};

  const sheetChrome =
    presentation === 'sheet'
      ? {
          sheetTitle: 'Bottom sheet',
          ...(sheetUsesDarkChrome
            ? {
                sheetBackdropStyle: styles.sheetBackdrop,
                sheetPickerWrapperStyle: styles.sheetPickerWrapper,
              }
            : {
                sheetTitleStyle: styles.sheetTitleText,
                sheetHeaderRowStyle: styles.sheetHeaderRow,
                sheetCardStyle: styles.sheetCard,
                sheetBackdropStyle: styles.sheetBackdrop,
                sheetPickerWrapperStyle: styles.sheetPickerWrapper,
                sheetCloseButtonStyle: styles.sheetCloseButton,
                sheetCloseIconStyle: styles.sheetCloseIcon,
              }),
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
      maxGap={maxGapForPreset(presetId, active.mode)}
      showUnit={active.showUnit}
      unit={active.unit}
      {...(active.mode === 'time' ? { timeUse12Hour: !!timeUse12Hour } : {})}
      value={value}
      startLabel="From"
      endLabel="To"
      headerLabelStyle={
        sheetUsesDarkChrome && active.mode !== 'date'
          ? undefined
          : styles.pickerHeaderLabel
      }
      colorScheme={colorScheme}
      presentation={presentation}
      sheetVisible={sheetVisible}
      onSheetVisibleChange={onSheetVisibleChange}
      onChange={(next, meta) => {
        onValueChange(next as DualPickerCombinedRange, meta);
      }}
      {...(active.mode === 'time' ? {} : { formatValue: (v) => String(v) })}
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
    /** Demo: `showUnit` + `unit` — suffix after each wheel value (skip for built-in `mode="time"`). */
    showUnit: true,
    unit: 'pts',
  },
  {
    id: 'cities',
    label: 'Cities',
    mode: 'range',
    data: CITY_DATA,
    initial: { start: 'Paris', end: 'Berlin' },
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
    id: 'time',
    label: 'Time',
    mode: 'time',
    modeOptions: { timeStepMinutes: 15 },
    initial: { start: 540, end: 1020 },
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
  const [timeUse12Hour, setTimeUse12Hour] = useState(false);
  const [sheetTimeUse12Hour, setSheetTimeUse12Hour] = useState(false);

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
  const [darkDemoValue, setDarkDemoValue] = useState<DualPickerRange>({
    start: 12,
    end: 24,
  });

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
      presetMaxGap('date', 'date')
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
      const delta = value.end - value.start;
      if (active.mode === 'time') {
        return `${delta} min`;
      }
      return String(delta);
    }
    if (
      active.mode === 'range' &&
      active.data &&
      typeof value.start === 'string' &&
      typeof value.end === 'string'
    ) {
      const list = active.data.filter(
        (x): x is string => typeof x === 'string'
      );
      if (list.length === active.data.length && list.length > 0) {
        const si = list.indexOf(value.start);
        const ei = list.indexOf(value.end);
        if (si >= 0 && ei >= 0) return `${ei - si} wheel steps`;
      }
    }
    return '— (string / index)';
  }, [calendarCanonForUi, value, active.mode, active.data]);

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
          Inline picker, a dark-mode sample, and a bottom sheet. Try all modes
          from the chips/buttons.
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

          {active.mode === 'time' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              nestedScrollEnabled
            >
              {(
                [
                  { v: false, label: '24-hour' },
                  { v: true, label: '12-hour' },
                ] as const
              ).map(({ v, label }) => {
                const sel = v === timeUse12Hour;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setTimeUse12Hour(v)}
                    style={[styles.chip, sel && styles.chipSelected]}
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <AppDualPicker
            active={active}
            activeModeOpts={activeModeOpts}
            timeUse12Hour={timeUse12Hour}
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
                  : formatWheelReadout(
                      active.mode,
                      value.start,
                      activeModeOpts,
                      active.mode === 'time' ? timeUse12Hour : undefined
                    )}
              </Text>
            </Text>
            <Text style={styles.readoutLine}>
              <Text style={styles.label}>end</Text>{' '}
              <Text style={styles.mono}>
                {calendarCanonForUi
                  ? formatCalendarPartsLabel(calendarCanonForUi.end)
                  : formatWheelReadout(
                      active.mode,
                      value.end,
                      activeModeOpts,
                      active.mode === 'time' ? timeUse12Hour : undefined
                    )}
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

        <View style={styles.darkSectionBlock}>
          <Text style={styles.darkSectionTitle}>Dark appearance (inline)</Text>
          <Text style={styles.darkSectionNote}>
            Same numeric range as “Numbers”, using the library{' '}
            <Text style={styles.darkMonoInline}>
              colorScheme=&quot;dark&quot;
            </Text>{' '}
            on a dark card so you can compare with the light block above.
          </Text>
          <View style={styles.darkPickerShell}>
            <DualPicker
              mode="range"
              colorScheme="dark"
              data={NUMERIC_DATA}
              value={darkDemoValue}
              minGap={1}
              maxGap={12}
              clampBehavior="push-end"
              autoShiftEnd
              startLabel="From"
              endLabel="To"
              formatValue={(v) => String(v)}
              showUnit
              unit="pts"
              onChange={(next) => setDarkDemoValue(next as DualPickerRange)}
            />
          </View>
          <View style={styles.darkReadout}>
            <Text style={styles.darkReadoutLine}>
              <Text style={styles.darkReadoutLabel}>start</Text>{' '}
              <Text style={styles.darkReadoutMono}>{darkDemoValue.start}</Text>
            </Text>
            <Text style={styles.darkReadoutLine}>
              <Text style={styles.darkReadoutLabel}>end</Text>{' '}
              <Text style={styles.darkReadoutMono}>{darkDemoValue.end}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Bottom sheet (all modes)</Text>
          <Text style={styles.sectionNote}>
            Tap any mode to open it in the sheet. Chrome follows the device
            light/dark setting (
            <Text style={styles.mono}>colorScheme=&quot;system&quot;</Text>
            ).
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

          {sheetActive.mode === 'time' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              nestedScrollEnabled
            >
              {(
                [
                  { v: false, label: '24-hour' },
                  { v: true, label: '12-hour' },
                ] as const
              ).map(({ v, label }) => {
                const sel = v === sheetTimeUse12Hour;
                return (
                  <Pressable
                    key={`sheet-${label}`}
                    onPress={() => setSheetTimeUse12Hour(v)}
                    style={[styles.chip, sel && styles.chipSelected]}
                  >
                    <Text
                      style={[styles.chipText, sel && styles.chipTextSelected]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

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
        timeUse12Hour={sheetTimeUse12Hour}
        value={sheetValue}
        onValueChange={onSheetPickerChange}
        pickerWidth={pickerWidth}
        presetId={sheetPresetId}
        presentation="sheet"
        colorScheme="system"
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
  darkSectionBlock: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3A3A3C',
  },
  darkSectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F2F2F7',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  darkSectionNote: {
    fontSize: 13,
    color: '#AEAEB2',
    marginBottom: 14,
    lineHeight: 19,
  },
  darkMonoInline: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 12,
    color: '#EBEBF5',
    fontWeight: '600',
  },
  darkPickerShell: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#48484A',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  darkReadout: {
    width: '100%',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#48484A',
    gap: 6,
  },
  darkReadoutLine: {
    fontSize: 15,
    color: '#F2F2F7',
  },
  darkReadoutLabel: {
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  darkReadoutMono: {
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '600',
    color: '#F2F2F7',
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
