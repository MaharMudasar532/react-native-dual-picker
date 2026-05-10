import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native';

/** Discrete wheel entry — numbers for numeric presets, strings for letters / localized labels. */
export type DualPickerValue = string | number;

export type DualPickerRange = {
  start: DualPickerValue;
  end: DualPickerValue;
};

/**
 * Wheel dataset: `range` / `dual` use caller `data` — **all finite numbers** or **all non-empty strings** (e.g. city names), in wheel order; preset modes build lists.
 * `date` renders a six-wheel **calendar** (start/end each = year + month + day); use `DualPickerCalendarRange` **or** partial `DualPickerCalendarRangeInput`.
 * `time` uses **`DualPickerRange`** with numeric **`start` / `end` as whole minutes** (minutes since midnight, 0–1439; see `DualPickerModeOptions` and root `timeUse12Hour`).
 */
export type DualPickerMode =
  | 'range'
  | 'dual'
  | 'day'
  | 'date'
  | 'month'
  | 'year'
  | 'weekday'
  | 'alphabet'
  | 'decimal'
  | 'time';

export type CalendarDateParts = {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 (clamped per month/year) */
  day: number;
};

export type DualPickerCalendarRange = {
  start: CalendarDateParts;
  end: CalendarDateParts;
};

/** Partial calendar triple for [`mode="date"`](/): omitted fields resolve via [`DualPickerModeOptions`](/) defaults, then the device's local date. */
export type CalendarDatePartsInput = Partial<CalendarDateParts>;

/** `start`/`end` may omit [`year`](#) · [`month`](#) · [`day`](#); wheels still receive canonical values after normalization. */
export type DualPickerCalendarRangeInput = {
  start: CalendarDatePartsInput;
  end: CalendarDatePartsInput;
};

/**
 * Column arrangement for [`mode="date"`](/):
 * - **`iso`** — Year · Month · Day (left→right inside each half)
 * - **`eu`** — Day · Month · Year
 * - **`us`** — Month · Day · Year
 */
export type DualPickerDateFormat = 'iso' | 'eu' | 'us';

export interface DualPickerModeOptions {
  /** For `mode="day"` — day-of-month list (1–31 by default). Not used when `mode="date"`. */
  dayFrom?: number;
  dayTo?: number;
  /** @default `'number'` → 1–12; `short` / `long` use `Intl` month names. */
  monthStyle?: 'number' | 'short' | 'long';
  monthLocale?: string;
  yearFrom?: number;
  yearTo?: number;
  /** @default `'number'` → 0–6; text styles use `Intl` weekday names. */
  weekdayStyle?: 'number' | 'short' | 'long' | 'narrow';
  weekdayLocale?: string;
  /** `0` Sun-first, `1` Mon-first (named weekday lists only). */
  weekdayFirstDay?: 0 | 1;
  decimalFrom?: number;
  decimalTo?: number;
  /** @default `0.05` */
  decimalStep?: number;
  /** @default lowercase a–z */
  alphabetUpperCase?: boolean;

  /** @default `'iso'` — only used when [`mode`](/) is `"date"`. */
  dateFormat?: DualPickerDateFormat;
  /** Passed to [`Intl`] for month labels when [`monthStyle`](/) is not `'number'` in date mode; defaults [`monthLocale`](/) ?? `'default'`. */
  dateLocale?: string;

  /** `mode="date"`: when a half omits year in `value`, use this before falling back to the device's local year. */
  defaultCalendarYear?: number;
  /** `mode="date"`: fallback month (`1–12`) when omitted on a half; day wheels lists use `daysInMonth` for that month. */
  defaultCalendarMonth?: number;
  /** `mode="date"`: fallback day when omitted (`1–31`, clamped to the resolved month). */
  defaultCalendarDay?: number;

  /**
   * `mode="time"`: step between wheel entries in **minutes** (1–60). List is `0 … 1439` aligned to this step.
   * @default `15`
   */
  timeStepMinutes?: number;
  /**
   * `mode="time"`: use 12-hour labels (`1:30 PM`) instead of 24-hour (`13:30`).
   * Overridden by root [`timeUse12Hour`](#) when that prop is set.
   * @default `false`
   */
  timeUse12Hour?: boolean;
}

/**
 * `value`: gaps use **datum arithmetic** on numbers (`end - start`).
 * `index`: gaps count **wheel steps** between selections (alphabet / localized labels).
 * @default Auto: `index` if any datum is a string, else `value`.
 */
export type DualPickerGapBasis = 'value' | 'index';

export type DualPickerClampBehavior = 'push-end' | 'push-start' | 'lock';

export type DualPickerNativeScrollEventLike = {
  nativeEvent: { contentOffset: { y: number } };
};

/** Why `onChange` fired (`auto-correct` reserved for future programmatic sync). */
export type DualPickerChangeReason =
  | 'user-scroll-start'
  | 'user-scroll-end'
  | 'auto-correct'
  | 'min-gap-enforced'
  | 'max-gap-enforced';

/** Where the picker is rendered: in layout (`inline`) or inside a bottom [`Modal`](https://reactnative.dev/docs/modal) shell (`sheet`). */
export type DualPickerPresentation = 'inline' | 'sheet';

/**
 * Light/dark appearance for default colors (wheels, headers, and sheet chrome when [`presentation`](#) is `'sheet'`).
 * @default `'light'` — matches existing releases. Use `'system'` with the device [`useColorScheme`](https://reactnative.dev/docs/usecolorscheme), or force `'dark'` / `'light'`.
 */
export type DualPickerColorScheme = 'light' | 'dark' | 'system';

export interface DualPickerProps {
  /**
   * Prefer `'range'` (behavior-focused). `'dual'` is a legacy synonym for `'range'`.
   */
  mode: DualPickerMode;
  clampBehavior?: DualPickerClampBehavior;
  /**
   * When `true`, increasing start can bump end forward (`push-end` + gap repair).
   * When `false`, end stays put and start is clamped backward instead (unless locked).
   * @default true
   */
  autoShiftEnd?: boolean;
  /** Required for `range` / `dual`: ordered **numbers** or **strings** (not mixed). Ignored by preset modes. */
  data?: DualPickerValue[];
  /** Bounds / locales for preset `mode`s (`day`, `month`, …). */
  modeOptions?: DualPickerModeOptions;
  /**
   * How `minGap` / `maxGap` are measured (`index` for text wheels).
   * When omitted: `index` if any datum is a string, else `value`.
   */
  gapBasis?: DualPickerGapBasis;
  minGap?: number;
  maxGap?: number;
  /**
   * When `true` (default), `minGap` / `maxGap` are enforced so **`end` stays at least `minGap` after `start`**
   * (numeric difference, wheel index steps, or whole UTC days in `mode="date"`).
   * When `false`, the two sides are **independent**: **`end` may be smaller than `start`**; gap props are ignored.
   */
  enforceRangeGap?: boolean;
  step?: number;
  formatValue?: (value: DualPickerValue) => string;
  /**
   * `mode="time"` only: `true` → 12-hour wheel labels (`1:30 PM`), `false` → 24-hour (`13:30`).
   * Takes precedence over `modeOptions.timeUse12Hour`.
   */
  timeUse12Hour?: boolean;
  /**
   * When `true` and `unit` is a non-empty string, each wheel row appends the unit after the formatted value.
   * Avoid with built-in `mode="time"` formatter (clock labels are already unambiguous).
   * @default false
   */
  showUnit?: boolean;
  /** Unit label when `showUnit` is true (e.g. `"kg"` for plain numeric wheels). */
  unit?: string;
  /** Text style for the unit suffix on wheel rows (merged after defaults). */
  unitTextStyle?: StyleProp<TextStyle>;
  /**
   * For `mode="date"`: accept `DualPickerCalendarRange` or partial `DualPickerCalendarRangeInput`. Missing fields on each half resolve from optional `modeOptions.defaultCalendar*` (when set), then the device's local date; day columns use that month's length.
   */
  value:
    | DualPickerRange
    | DualPickerCalendarRange
    | DualPickerCalendarRangeInput;
  onChange?: (
    range: DualPickerRange | DualPickerCalendarRange,
    meta?: { reason: DualPickerChangeReason }
  ) => void;
  itemHeight?: number;
  visibleItemCount?: number;
  /**
   * Outermost wrapper (`<View>`) — width defaults to `'100%'`.
   * Alias for callers who prefer naming over bare `style`.
   */
  style?: ViewProps['style'];
  containerStyle?: ViewProps['style'];
  startColumnWrapperStyle?: ViewProps['style'];
  endColumnWrapperStyle?: ViewProps['style'];
  /** Start header / label (default: `'START'` in range wheels, `'FROM'` in `mode="date"`). */
  startLabel?: string;
  /** End header / label (default: `'END'` or `'TO'` respectively). */
  endLabel?: string;
  /** Wrapper for the two heading labels above the wheels */
  headerRowStyle?: ViewProps['style'];
  /** Applied to both header labels before column-specific overrides */
  headerLabelStyle?: StyleProp<TextStyle>;
  headerLabelStartStyle?: StyleProp<TextStyle>;
  headerLabelEndStyle?: StyleProp<TextStyle>;
  /** Picker chrome: wheel viewport + selection overlay (both modes); in `mode="date"` also use [`dateWheelAreaStyle`](#). */
  pickerChromeStyle?: ViewProps['style'];
  /** Passed to the centered selection overlay lane (`mode="date"`: before [`dateSelectionLaneStyle`](#); two-wheel modes: before [`dualWheelSelectionLaneStyle`](#)). */
  highlightBandStyle?: ViewProps['style'];
  /** Wheel values that are not in the centered row */
  valueTextStyle?: StyleProp<TextStyle>;
  /** Centered / committed value text (both wheels; two-wheel modes: also [`dualWheelStartSelectedTextStyle`](#) / [`dualWheelEndSelectedTextStyle`](#)). */
  selectedValueTextStyle?: StyleProp<TextStyle>;
  /** Row wrapper (`<View>`) for each wheel value; two-wheel: [`dualWheelStartSelectedCellStyle`](#) / [`dualWheelEndSelectedCellStyle`](#) for committed row. */
  valueCellStyle?: StyleProp<ViewStyle>;
  selectedValueCellStyle?: StyleProp<ViewStyle>;

  // --- Two-wheel modes (`alphabet`, `month`, `range`, … — not `date`) ---

  /** Vertical divider between start and end columns */
  dualWheelDividerStyle?: StyleProp<ViewStyle>;
  /** Merged into [`pickerChromeStyle`](#) wheel viewport */
  dualWheelWheelAreaStyle?: ViewProps['style'];
  /** Convenience `backgroundColor` for the wheel viewport (e.g. `#fff`) */
  dualWheelWheelAreaBackgroundColor?: string;
  /**
   * Center selection lane (continuous across both wheels; horizontal hairlines).
   * Merged after defaults and [`highlightBandStyle`](#). Selected row cells use a transparent fill so this lane shows through.
   */
  dualWheelSelectionLaneStyle?: ViewProps['style'];
  /** Convenience tint for the selection lane */
  dualWheelSelectionLaneBackgroundColor?: string;
  /**
   * Start wheel — committed-row text (merged after [`selectedValueTextStyle`](#)).
   * Use for bold/size independent of idle [`valueTextStyle`](#).
   */
  dualWheelStartSelectedTextStyle?: StyleProp<TextStyle>;
  /** End wheel — committed-row text (merged after [`selectedValueTextStyle`](#)). */
  dualWheelEndSelectedTextStyle?: StyleProp<TextStyle>;
  /** Start wheel — committed row cell wrapper (merged after [`selectedValueCellStyle`](#)). */
  dualWheelStartSelectedCellStyle?: StyleProp<ViewStyle>;
  dualWheelEndSelectedCellStyle?: StyleProp<ViewStyle>;

  // --- `mode="date"` appearance (ignored by other modes) ---

  /**
   * Inner card/box around the calendar content (title, FROM/TO, Y/M/D row, wheels).
   * Use for padding, background, border radius, shadow.
   */
  dateContentWrapperStyle?: ViewProps['style'];
  /**
   * Optional heading above the FROM/TO row (string is wrapped in `<Text>` with [`dateTitleStyle`](#)).
   * Pass a custom node (e.g. `<Text>`) for full control.
   */
  dateTitle?: ReactNode;
  /** Wrapper around [`dateTitle`](#) (and only the title — not FROM/TO). */
  dateTitleWrapperStyle?: ViewProps['style'];
  /** Typography when [`dateTitle`](#) is a plain string */
  dateTitleStyle?: StyleProp<TextStyle>;

  /**
   * Vertical rule between FROM/TO, between field-caption halves (Y/M/D), and between wheel halves.
   * Overrides default hairline; use [`dateBetweenHalvesDividerInHeaderStyle`](#) (etc.) for one slot only.
   */
  dateBetweenHalvesDividerStyle?: StyleProp<ViewStyle>;
  /** Vertical divider below FROM | TO only */
  dateBetweenHalvesDividerHeaderStyle?: StyleProp<ViewStyle>;
  /** Vertical divider in the Y / M / D caption row only */
  dateBetweenHalvesDividerFieldLabelsStyle?: StyleProp<ViewStyle>;
  /** Vertical divider between the two triple-wheel halves only */
  dateBetweenHalvesDividerWheelsStyle?: StyleProp<ViewStyle>;

  /** Row wrapping the six Y · M · D captions */
  dateFieldLabelsRowStyle?: ViewProps['style'];
  /** Typography for each Y / M / D caption */
  dateFieldCaptionTextStyle?: StyleProp<TextStyle>;

  /** Merged into the wheels container (below captions). Overrides / extends [`pickerChromeStyle`](#). */
  dateWheelAreaStyle?: ViewProps['style'];
  /** Convenience — sets `backgroundColor` on the wheel area */
  dateWheelAreaBackgroundColor?: string;

  /**
   * Center selection lane overlay (filled band + horizontal hairlines above/below committed row).
   * Merged after defaults and after [`highlightBandStyle`](#).
   */
  dateSelectionLaneStyle?: ViewProps['style'];
  /** Convenience — selection lane tint; same as putting `backgroundColor` on [`dateSelectionLaneStyle`](#). */
  dateSelectionLaneBackgroundColor?: string;

  // --- Bottom sheet [`Modal`](https://reactnative.dev/docs/modal) (optional) ---

  /** @default `'light'` */
  colorScheme?: DualPickerColorScheme;

  /**
   * `'inline'` — render wheels only (default). `'sheet'` — wrap wheels in a slide-up `Modal` with backdrop; control with [`sheetVisible`](#) / [`onSheetVisibleChange`](#).
   */
  presentation?: DualPickerPresentation;
  /** When [`presentation`](#) is `'sheet'`, whether the modal is visible (controlled). */
  sheetVisible?: boolean;
  /** When [`presentation`](#) is `'sheet'`, notify open/close. */
  onSheetVisibleChange?: (visible: boolean) => void;
  /**
   * Forwarded to [`Modal`](https://reactnative.dev/docs/modal#animationtype). For [`presentation`](#) `'sheet'`, **`'none'`** is the default so the built-in sheet/backdrop animations stay smooth; `'slide'` / `'fade'` can conflict and flash on close.
   */
  sheetAnimationType?: 'none' | 'slide' | 'fade';
  /** Forwarded to [`Modal`](https://reactnative.dev/docs/modal#statusbartranslucent-ios). */
  sheetStatusBarTranslucent?: boolean;
  /** When `true`, tapping the dimmed area does not call [`onSheetVisibleChange(false)`](#). @default false */
  sheetBackdropDismissDisabled?: boolean;
  /** Full-screen pressable behind the card (dim layer). */
  sheetBackdropStyle?: StyleProp<ViewStyle>;
  /** Root `<View>` inside `Modal` (`flex: 1`). */
  sheetRootStyle?: ViewProps['style'];
  /** Column that pins the card to the bottom (`flex: 1`, `justifyContent: 'flex-end'` by default). */
  sheetContainerStyle?: ViewProps['style'];
  /** Rounded panel wrapping header + picker (background, radius, maxHeight, padding). */
  sheetCardStyle?: ViewProps['style'];
  /** Header row (title + trailing control). Merged after default padding. */
  sheetHeaderRowStyle?: ViewProps['style'];
  /** Header title; string is wrapped in `<Text>` with [`sheetTitleStyle`](#). */
  sheetTitle?: ReactNode;
  sheetTitleStyle?: StyleProp<TextStyle>;
  /**
   * When `false`, hides the default sheet header (title row + close/done). Backdrop tap / Android back still dismiss unless disabled.
   * Ignored if [`renderSheetHeader`](#) is set (custom header replaces it). @default true
   */
  sheetShowHeader?: boolean;
  /**
   * When `false`, hides the **drag handle bar** only; title and close remain unless [`sheetShowHeader`](#) is `false`.
   * Ignored if [`renderSheetHeader`](#) is set. @default true
   */
  sheetShowGrabber?: boolean;
  /**
   * When `false`, open/close and swipe-dismiss use **no** motion: sheet and backdrop snap instantly. Useful to “stop” sheet transitions.
   * @default true
   */
  sheetAnimateTransitions?: boolean;
  /** Trailing control: **`close`** — circular × button; **`done`** — text button ([`sheetDoneLabel`](#)). */
  sheetHeaderTrailing?: 'close' | 'done';
  /** @default true when header is shown — shows trailing dismiss control per [`sheetHeaderTrailing`](#). */
  sheetShowDoneButton?: boolean;
  /** @default `'Done'` (only when [`sheetHeaderTrailing`](#) is `'done'`) */
  sheetDoneLabel?: string;
  sheetDoneTextStyle?: StyleProp<TextStyle>;
  /** `Pressable` wrapper around the close glyph (size, background). */
  sheetCloseButtonStyle?: StyleProp<ViewStyle>;
  /** Typography for the × glyph ([`sheetHeaderTrailing`](#) `'close'`). */
  sheetCloseIconStyle?: StyleProp<TextStyle>;
  /** @default `'Close'` */
  sheetCloseAccessibilityLabel?: string;
  /** @default 12 */
  sheetDoneHitSlop?: number;
  /** Called when the trailing control (close or done) is pressed; runs before the sheet closes. */
  onSheetDonePress?: () => void;
  /**
   * When `true`, dragging the grabber + header strip downward dismisses the sheet (after distance / velocity thresholds).
   * Does not affect wheel scrolling (gesture is limited to the top chrome). @default true
   */
  sheetSwipeToDismiss?: boolean;
  /** Minimum downward drag (px) to dismiss when velocity is low. @default 72 */
  sheetSwipeDismissThreshold?: number;
  /** Minimum upward velocity is ignored; downward `vy` above this (px/ms) helps dismiss. @default 0.35 */
  sheetSwipeDismissVelocity?: number;
  /** Wrapper around the picker body inside the sheet card (e.g. horizontal padding). */
  sheetPickerWrapperStyle?: ViewProps['style'];
  /** Replace the entire header row (title + done). When set, [`sheetTitle`](#) / done props are ignored. */
  renderSheetHeader?: () => ReactNode;
}
