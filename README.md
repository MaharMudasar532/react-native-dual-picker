# React Native Dual Picker (Range, Date, Bottom Sheet)

**Two scroll wheels** for **React Native** (iOS & Android): pick a **From** and **To** on the same list—numbers, city names, times, full calendar ranges, and more. Optional **bottom sheet**, **`colorScheme`** (light / dark / system), **TypeScript**.

> **Keywords:** `react-native` · `dual-picker` · `range-picker` · `wheel-picker` · `date-range-picker` · `bottom-sheet` · `from-to-picker` · `ios` · `android`

---

## The smallest example

```tsx
import { useState } from 'react';
import { DualPicker } from 'react-native-dual-picker';

const [range, setRange] = useState({ start: 10, end: 18 });

<DualPicker
  mode="range"
  data={[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
  value={range}
  minGap={1}
  maxGap={12}
  onChange={(next) => setRange(next as typeof range)}
/>
```

| Piece | Meaning |
| ----- | -------- |
| **`mode="range"`** | Use your own **`data`** array (all numbers **or** all strings, never mixed). |
| **`value`** | `{ start, end }` — each must be an entry from **`data`**. |
| **`minGap` / `maxGap`** | How far apart **`end`** and **`start`** may be (for numbers: difference; for strings: steps between rows). |

**Next:** [Install](#installation) · [GIF demos](#demos-gifs) · [Recipes](#developer-cookbook--copy--paste) · [Props](#props-reference)

## Installation

```bash
yarn add react-native-dual-picker
# or: npm install react-native-dual-picker
```

Peer dependencies: **`react`**, **`react-native`** (see `package.json`).

<!--
  README images use absolute `raw/master` URLs so they render on GitHub and npm. Forks: replace `MaharMudasar532/react-native-dual-picker`. Mirror: https://cdn.jsdelivr.net/gh/MaharMudasar532/react-native-dual-picker@master/dual.gif
-->

---

## Demos (GIFs)

<p align="center">
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/dual.gif" alt="Dual picker — overview" width="32%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/withoutbottom.gif" alt="Dual picker inline — no bottom sheet" width="32%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/bottomsheet.gif" alt="Dual picker bottom sheet" width="32%" />
</p>

<p align="center"><em><code>dual.gif</code> · inline · bottom sheet</em></p>

---

## Gallery (modes & presets)

Static shots from the repo root (same `raw/master` URL pattern as the GIFs):

<p align="center">
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/24h_time.png" alt="Time range 24-hour" width="24%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/12h_time.png" alt="Time range 12-hour" width="24%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/a-z.png" alt="Alphabet mode A–Z" width="24%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/cities.png" alt="Cities string range" width="24%" />
</p>

<p align="center">
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/bottom_sheet_12h.png" alt="Bottom sheet with 12-hour time" width="45%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/dark.png" alt="Dark mode colorScheme" width="45%" />
</p>

<p align="center"><sub><code>24h_time.png</code> · <code>12h_time.png</code> · <code>a-z.png</code> · <code>cities.png</code> · <code>bottom_sheet_12h.png</code> · <code>dark.png</code> (<code>colorScheme=&quot;dark&quot;</code> / <code>&quot;system&quot;</code>)</sub></p>

---

## Features

- Two wheels (**From** / **To** or **Start** / **End**) with shared selection lane  
- **`minGap` / `maxGap`** — numeric or index-based (`gapBasis`); **`mode="date"`** uses whole **UTC** days (skipped when **`enforceRangeGap={false}`**)  
- **`enforceRangeGap`** — default **`true`**: forward range; set **`false`** for independent wheels (**`end` may be smaller than `start`**)  
- **Calendar mode** — six wheels, **ISO / EU / US** column order, localized months  
- **Partial `value`** for date mode + **`modeOptions.defaultCalendar*`** fallbacks + local “today”  
- **`presentation="sheet"`** — modal, animated backdrop, swipe-to-dismiss, customizable chrome  
- **`colorScheme`** — `'light'` \| `'dark'` \| `'system'` for default wheel + sheet colors  
- **`PickerColumn`**, **`useDualPicker`** for custom UIs  

---

## Roadmap

| Priority | Item | Notes |
| -------- | ---- | ----- |
| **P0** | Dark / system appearance | Shipped — root **`colorScheme`**: `'light'` \| `'dark'` \| `'system'`. |

If you want to extend the library further, a sane order is:

1. **`mode="time"`** — From/To time range (implemented); optional 12h/24h via props.
2. **Generic columns** — refactor internals once you have 2–3 column types.
3. **Infinite scroll** — after the column API stabilizes.
4. **Snap animation pass** — can ship incrementally alongside (1).

---

## Developer cookbook — copy & paste

Use **`https://github.com/…/raw/master/…`** (or the [jsDelivr mirror](https://cdn.jsdelivr.net/gh/MaharMudasar532/react-native-dual-picker@master/dual.gif)) for the same assets as in the gallery above. Replace the repo path if you use a fork.

All snippets assume:

```tsx
import { useState } from 'react';
import { DualPicker } from 'react-native-dual-picker';
```

and a controlled `value` + `onChange` unless noted.

### 1) Numeric range (From / To)

`minGap` / `maxGap` are the **numeric difference** between `start` and `end` when the list is all numbers.

```tsx
const DATA = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

<DualPicker
  mode="range"
  data={DATA}
  value={{ start: 10, end: 18 }}
  minGap={1}
  maxGap={12}
  clampBehavior="push-end"
  autoShiftEnd
  startLabel="From"
  endLabel="To"
  formatValue={(v) => String(v)}
  onChange={(range) => console.log(range)}
/>
```

### 2) Numeric range + unit suffix (`showUnit`)

Appends a label after every row value (good for plain numbers; skip for `mode="time"` built-in labels).

```tsx
<DualPicker
  mode="range"
  data={[10, 11, 12, 13, 14, 15]}
  value={{ start: 11, end: 14 }}
  minGap={1}
  maxGap={8}
  showUnit
  unit="pts"
  formatValue={(v) => String(v)}
  onChange={(r) => console.log(r)}
/>
```

### 3) String list — cities (or any labels)

`data` must be **all strings** (non-empty) or **all numbers** — not mixed. Gaps use **wheel index steps** automatically (`gapBasis: 'index'`).

```tsx
const CITIES = [
  'London',
  'Paris',
  'Tokyo',
  'Sydney',
  'Dubai',
  'New York',
  'Berlin',
];

<DualPicker
  mode="range"
  data={CITIES}
  value={{ start: 'Paris', end: 'Berlin' }}
  minGap={1}
  maxGap={5}
  startLabel="From"
  endLabel="To"
  formatValue={(v) => String(v)}
  onChange={(r) => console.log(r)}
/>
```

### 4) Alphabet (`a–z` / `A–Z`)

```tsx
<DualPicker
  mode="alphabet"
  value={{ start: 'a', end: 'f' }}
  minGap={1}
  maxGap={10}
  onChange={(r) => console.log(r)}
/>
```

Uppercase: `modeOptions={{ alphabetUpperCase: true }}`.

### 5) Decimal steps

```tsx
<DualPicker
  mode="decimal"
  modeOptions={{ decimalFrom: 0, decimalTo: 2, decimalStep: 0.1 }}
  value={{ start: 0, end: 0.5 }}
  minGap={1}
  maxGap={8}
  onChange={(r) => console.log(r)}
/>
```

### 6) Month · day · year · weekday

```tsx
// Month (1–12 or localized names)
<DualPicker
  mode="month"
  modeOptions={{ monthStyle: 'number' }}
  value={{ start: 3, end: 9 }}
  minGap={1}
  maxGap={12}
  onChange={(r) => console.log(r)}
/>

// Day of month (not calendar mode)
<DualPicker
  mode="day"
  modeOptions={{ dayFrom: 1, dayTo: 31 }}
  value={{ start: 5, end: 18 }}
  minGap={1}
  maxGap={20}
  onChange={(r) => console.log(r)}
/>

// Year list
<DualPicker
  mode="year"
  modeOptions={{ yearFrom: 2020, yearTo: 2035 }}
  value={{ start: 2026, end: 2029 }}
  minGap={1}
  maxGap={8}
  onChange={(r) => console.log(r)}
/>

// Weekday: 0–6 (JS Sunday=0) or names
<DualPicker
  mode="weekday"
  modeOptions={{ weekdayStyle: 'short', weekdayFirstDay: 1 }}
  value={{ start: 1, end: 5 }}
  minGap={1}
  maxGap={4}
  onChange={(r) => console.log(r)}
/>
```

### 7) Time range — 24-hour vs 12-hour

Values are **minutes since midnight** (`0` … `1439`). Use root **`timeUse12Hour`** (wins over `modeOptions.timeUse12Hour`) or omit and set only `modeOptions`.

**24-hour (`24h_time.png`):**

```tsx
<DualPicker
  mode="time"
  timeUse12Hour={false}
  modeOptions={{ timeStepMinutes: 15 }}
  value={{ start: 540, end: 1020 }}
  minGap={1}
  maxGap={480}
  startLabel="From"
  endLabel="To"
  onChange={(r) => console.log(r)}
/>
```

**12-hour (`12h_time.png`):**

```tsx
<DualPicker
  mode="time"
  timeUse12Hour
  modeOptions={{ timeStepMinutes: 15 }}
  value={{ start: 540, end: 1020 }}
  minGap={1}
  maxGap={480}
  onChange={(r) => console.log(r)}
/>
```

Optional: `import { formatDualPickerTimeMinutes } from 'react-native-dual-picker'` for labels outside the picker.

### 8) Calendar date range (`mode="date"`)

`minGap` / `maxGap` are **whole UTC calendar days** between `start` and `end`. Pick a large enough `maxGap` for multi-year ranges (e.g. trip planners).

```tsx
<DualPicker
  mode="date"
  value={{
    start: { year: 2026, month: 5, day: 9 },
    end: { year: 2026, month: 8, day: 20 },
  }}
  modeOptions={{
    dateFormat: 'iso',
    monthStyle: 'short',
    yearFrom: 2000,
    yearTo: 2035,
  }}
  minGap={1}
  maxGap={3650}
  startLabel="From"
  endLabel="To"
  onChange={(range) => console.log(range)}
/>
```

**EU / US column order:** `modeOptions={{ dateFormat: 'eu' }}` or `'us'`.

**Partial `value`:** halves may omit `year` / `month` / `day`; defaults use `modeOptions.defaultCalendar*` then **today** (local). Normalize for display:

```tsx
import { normalizeDualPickerCalendarValue } from 'react-native-dual-picker';

const canonical = normalizeDualPickerCalendarValue(
  { start: {}, end: {} },
  modeOptions,
  1,
  3650
);
```

### 9) Bottom sheet — numeric range

Same as inline, plus `presentation`, `sheetVisible`, `onSheetVisibleChange`, and optional sheet chrome props. Add **`colorScheme="dark"`** or **`colorScheme="system"`** for a dark sheet and wheels (see Theme table).

```tsx
const [open, setOpen] = useState(false);
const [value, setValue] = useState({ start: 10, end: 18 });

<>
  <Pressable onPress={() => setOpen(true)}><Text>Open</Text></Pressable>
  <DualPicker
    mode="range"
    data={[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
    value={value}
    minGap={1}
    maxGap={12}
    presentation="sheet"
    colorScheme="system"
    sheetVisible={open}
    onSheetVisibleChange={setOpen}
    sheetTitle="Choose range"
    sheetSwipeToDismiss
    onChange={(next) => setValue(next as typeof value)}
  />
</>
```

### 10) Bottom sheet + 12h time (`bottom_sheet_12h.png`)

```tsx
const [open, setOpen] = useState(false);
const [value, setValue] = useState({ start: 540, end: 1020 });

<DualPicker
  mode="time"
  timeUse12Hour
  modeOptions={{ timeStepMinutes: 15 }}
  value={value}
  minGap={1}
  maxGap={480}
  presentation="sheet"
  sheetVisible={open}
  onSheetVisibleChange={setOpen}
  sheetTitle="Time range"
  onChange={(next) => setValue(next as typeof value)}
/>
```

### 11) Independent wheels (`end` may be before `start`)

```tsx
<DualPicker
  mode="range"
  data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
  value={{ start: 9, end: 2 }}
  enforceRangeGap={false}
  onChange={(r) => console.log(r)}
/>
```

### 12) Force gap basis (`gapBasis`)

Usually inferred: **`index`** if any wheel item is a string, else **`value`**. Override if needed:

```tsx
<DualPicker
  mode="range"
  data={[1, 2, 3, 4, 5]}
  gapBasis="index"
  minGap={1}
  maxGap={3}
  value={{ start: 2, end: 5 }}
  onChange={(r) => console.log(r)}
/>
```

### Full runnable matrix

`example/src/App.tsx` implements every mode (including chips for **date layout**, **24h/12h time**, and a **second** `DualPicker` in a sheet).

---

## Quick start

Same as [**The smallest example**](#the-smallest-example) (controlled `useState` + `onChange`). For time, cities, calendar, bottom sheet, and dark mode, use the [Developer cookbook](#developer-cookbook--copy--paste).

### Calendar (`mode="date"`) — short

```tsx
<DualPicker
  mode="date"
  value={{
    start: { year: 2026, month: 6, day: 9 },
    end: { year: 2026, month: 8, day: 20 },
  }}
  modeOptions={{
    dateFormat: 'iso',
    monthStyle: 'short',
    yearFrom: 2000,
    yearTo: 2035,
  }}
  minGap={1}
  maxGap={3650}
  onChange={(range) => console.log(range)}
/>
```

Helpers (exported): **`normalizeDualPickerCalendarValue`**, **`resolveDualPickerCalendarInput`**, **`nowLocalCalendarParts`**, **`calendarYearBoundsFromOptions`**.

---

## Start vs end — can **`end`** be smaller than **`start`**?

**Default (`enforceRangeGap` omitted or `true`):** the picker keeps a **forward** range. The right column is always **`end`** (**To**). If **`end`** would violate **`minGap` / `maxGap`**, it is **corrected** (and **`clampBehavior`** / **`autoShiftEnd`** decide how). **`mode="date"`** also runs **`normalizeCalendarEnds`** so an **`end`** before **`start`** is folded up to match **`start`** before gap repair.

**Opt-in — `enforceRangeGap={false}`:** the two wheels are **independent**. **`minGap`**, **`maxGap`**, **`clampBehavior`**, and **`autoShiftEnd`** no longer couple the columns. **`end` may be numerically or chronologically smaller than `start`**; each side is only snapped to valid wheel data (and calendar halves still respect year bounds / partial-value resolution).

```tsx
// Numeric: To can be less than From
<DualPicker
  mode="range"
  data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
  value={{ start: 9, end: 2 }}
  enforceRangeGap={false}
  onChange={(range) => console.log(range)} // e.g. { start: 9, end: 2 }
/>

// Calendar: end date may be before start date (UTC ordering)
<DualPicker
  mode="date"
  enforceRangeGap={false}
  value={{
    start: { year: 2026, month: 8, day: 1 },
    end: { year: 2026, month: 6, day: 9 },
  }}
  modeOptions={{ yearFrom: 2020, yearTo: 2030, dateFormat: 'iso' }}
  onChange={(range) => console.log(range)}
/>
```

Use **`normalizeDualPickerCalendarValue(..., enforceRangeGap)`** if you mirror the same rules outside the picker.

---

## More examples

**Bottom sheet:** full copy-paste snippets are in **Developer cookbook** §9 (numeric) and §10 (12h time). Behavior notes:

- **`sheetVisible`** + **`onSheetVisibleChange`** control the `Modal`.
- Backdrop tap closes unless **`sheetBackdropDismissDisabled`**.
- **`onSheetDonePress`** runs for **× / Done** — not for backdrop-only or swipe dismiss (see props table below).

**Alphabet / decimal / month / cities / time:** see cookbook §4–§8.

### Partial calendar `value` + normalization

```tsx
import {
  DualPicker,
  normalizeDualPickerCalendarValue,
} from 'react-native-dual-picker';

const modeOptions = {
  dateFormat: 'iso' as const,
  monthStyle: 'short' as const,
  yearFrom: 2000,
  yearTo: 2035,
};

const raw = { start: {}, end: {} };

const canonical = normalizeDualPickerCalendarValue(raw, modeOptions, 1, 3650);
```

The runnable **preset matrix** (every mode, date ISO/EU/US chips, 24h/12h time, sheet instance) is **`example/src/App.tsx`**.

---

## Modes (`mode`)

| Value | Description |
| ----- | ----------- |
| `range` | List from **`data`**: **all numbers** (sorted) **or** **all strings** (order preserved; gaps use **index**). Prefer over legacy `dual`. |
| `dual` | Legacy alias for **`range`**. |
| `date` | Six calendar wheels (start/end × Y/M/D). |
| `day` | Day-of-month list (`modeOptions.dayFrom` / `dayTo`). |
| `month` | Month list (`monthStyle`, `monthLocale`). |
| `year` | Year list (`yearFrom`, `yearTo`). |
| `weekday` | Weekday list (`weekdayStyle`, `weekdayLocale`, `weekdayFirstDay`). |
| `alphabet` | a–z / A–Z (`alphabetUpperCase`). |
| `decimal` | Stepped decimals (`decimalFrom`, `decimalTo`, `decimalStep`). |
| `time` | Minutes since midnight (`0`…`1439`); **`timeUse12Hour`** / **`modeOptions.timeUse12Hour`**, **`timeStepMinutes`**. |

---

## `modeOptions` (`DualPickerModeOptions`)

| Prop | Type | Default / notes |
| ---- | ---- | ---------------- |
| `dayFrom` / `dayTo` | `number` | **`mode="day"`** only (not `date`). |
| `monthStyle` | `'number' \| 'short' \| 'long'` | Month labels. |
| `monthLocale` | `string` | `Intl` locale for months. |
| `yearFrom` / `yearTo` | `number` | Year wheel bounds; **`date`** uses these too. |
| `weekdayStyle` | `'number' \| 'short' \| 'long' \| 'narrow'` | |
| `weekdayLocale` | `string` | |
| `weekdayFirstDay` | `0 \| 1` | Sun-first vs Mon-first (named weekdays). |
| `decimalFrom` / `decimalTo` / `decimalStep` | `number` | **`mode="decimal"`**. |
| `alphabetUpperCase` | `boolean` | Default lowercase a–z. |
| `dateFormat` | `'iso' \| 'eu' \| 'us'` | **`mode="date"`** column order. |
| `dateLocale` | `string` | `Intl` for date-mode month labels when not numeric. |
| `defaultCalendarYear` | `number` | Fallback when a **`value`** half omits **year**. |
| `defaultCalendarMonth` | `number` | Fallback when **month** omitted (`1–12`). |
| `defaultCalendarDay` | `number` | Fallback when **day** omitted. |
| `timeStepMinutes` | `number` | **`mode="time"`**: step 1–60; default `15`. |
| `timeUse12Hour` | `boolean` | **`mode="time"`**: 12h labels; overridden by root **`timeUse12Hour`** when set. |

---

## Props reference

These tables document **`<DualPicker />`**. Only **`mode`** and **`value`** are required. The tables below follow the same **topics** you use when integrating: what data you show, how **From/To** interact, how rows look, then calendar/sheet-only knobs.

### 1) Mode & data

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| **`mode`** | `DualPickerMode` | **required** | Preset (see [**Modes**](#modes-mode)). |
| **`value`** | `DualPickerRange` \| `DualPickerCalendarRange` \| `DualPickerCalendarRangeInput` | **required** | Selected **start** / **end**. For **`date`**, halves may omit `year`/`month`/`day`; resolved via **`modeOptions.defaultCalendar*`** then **today**. **`onChange`** always emits full `DualPickerCalendarRange`. |
| **`onChange`** | `(range, meta?) => void` | — | Updates; **`meta.reason`** is `DualPickerChangeReason`. |
| **`data`** | `DualPickerValue[]` | — | For **`range`** / **`dual`**: one array of **all numbers** or **all non-empty strings** (e.g. cities)—never mixed. |
| **`modeOptions`** | `DualPickerModeOptions` | — | Bounds, locales, calendar/time defaults (see [**modeOptions**](#modeoptions-dualpickermodeoptions)). |

### 2) Range rules (gaps & coupling)

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| **`minGap`** / **`maxGap`** | `number` | — | Allowed distance between **start** and **end** (number difference, string **index** steps, or **UTC days** in **`date`**). Ignored if **`enforceRangeGap={false}`**. |
| **`enforceRangeGap`** | `boolean` | `true` | **`false`** → wheels are **independent**; **end** may be before **start**; gap props ignored. |
| **`gapBasis`** | `'value' \| 'index'` | auto | **`index`** if any item in **`data`** is a string, else **`value`**. |
| **`step`** | `number` | — | Optional step for **numeric** **`range`** data. |
| **`clampBehavior`** | `'push-end' \| 'push-start' \| 'lock'` | — | How to fix **start/end** when a move would break **`minGap`/`maxGap`**. |
| **`autoShiftEnd`** | `boolean` | `true` | With **`push-end`**, dragging **start** can push **end** forward. |

### 3) Labels, time & units

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| **`formatValue`** | `(DualPickerValue) => string` | — | How each row label is shown (default: `String(value)` except built-in **`time`**). |
| **`timeUse12Hour`** | `boolean` | — | **`mode="time"`** only: **`true`** → 12h labels; overrides **`modeOptions.timeUse12Hour`**. |
| **`showUnit`** | `boolean` | `false` | Append **`unit`** after each value (avoid with built-in **`time`** labels). |
| **`unit`** | `string` | — | Suffix when **`showUnit`** (e.g. `kg`, `pts`). |
| **`unitTextStyle`** | `TextStyle` | — | Style for the suffix. |

### 4) Layout & shared styling

| Prop | Type | Description |
| ---- | ---- | ----------- |
| **`itemHeight`** | `number` | Row height (px). |
| **`visibleItemCount`** | `number` | Odd count preferred; centers selection. |
| **`style`** / **`containerStyle`** | `ViewStyle` | Outermost / container. |
| **`startColumnWrapperStyle`** / **`endColumnWrapperStyle`** | `ViewStyle` | Per-column wrappers (two-wheel modes). |
| **`startLabel`** / **`endLabel`** | `string` | Default **START**/**END** or **FROM**/**TO** in date mode. |
| **`headerRowStyle`** | `ViewStyle` | Label row wrapper. |
| **`headerLabelStyle`** | `TextStyle` | Base label text. |
| **`headerLabelStartStyle`** / **`headerLabelEndStyle`** | `TextStyle` | Start / end label overrides. |
| **`pickerChromeStyle`** | `ViewStyle` | Wheel viewport chrome. |
| **`highlightBandStyle`** | `ViewStyle` | Selection overlay (under lane tint). |
| **`valueTextStyle`** | `TextStyle` | Idle wheel row text. |
| **`selectedValueTextStyle`** | `TextStyle` | Centered / committed row text. |
| **`valueCellStyle`** / **`selectedValueCellStyle`** | `ViewStyle` | Row wrappers. |

### 5) Two-wheel layout (`dualWheel*` — ignored when `mode="date"`)

| Prop | Type | Description |
| ---- | ---- | ----------- |
| **`dualWheelDividerStyle`** | `ViewStyle` | Vertical rule between columns. |
| **`dualWheelWheelAreaStyle`** | `ViewStyle` | Wheel viewport. |
| **`dualWheelWheelAreaBackgroundColor`** | `string` | Shortcut for wheel area background. |
| **`dualWheelSelectionLaneStyle`** | `ViewStyle` | Center lane + hairlines. |
| **`dualWheelSelectionLaneBackgroundColor`** | `string` | Lane tint. |
| **`dualWheelStartSelectedTextStyle`** / **`dualWheelEndSelectedTextStyle`** | `TextStyle` | Committed text per wheel. |
| **`dualWheelStartSelectedCellStyle`** / **`dualWheelEndSelectedCellStyle`** | `ViewStyle` | Committed cell per wheel. |

### 6) Calendar layout (`date*` — ignored unless `mode="date"`)

| Prop | Type | Description |
| ---- | ---- | ----------- |
| **`dateContentWrapperStyle`** | `ViewStyle` | Card around title, FROM/TO, captions, wheels. |
| **`dateTitle`** | `ReactNode` | Heading above FROM/TO (string wrapped with **`dateTitleStyle`**). |
| **`dateTitleWrapperStyle`** | `ViewStyle` | Title-only wrapper. |
| **`dateTitleStyle`** | `TextStyle` | Title typography. |
| **`dateBetweenHalvesDividerStyle`** | `ViewStyle` | Default vertical dividers (all slots). |
| **`dateBetweenHalvesDividerHeaderStyle`** | `ViewStyle` | Divider under FROM \| TO only. |
| **`dateBetweenHalvesDividerFieldLabelsStyle`** | `ViewStyle` | Divider in Y/M/D caption row. |
| **`dateBetweenHalvesDividerWheelsStyle`** | `ViewStyle` | Divider between triple-wheel halves. |
| **`dateFieldLabelsRowStyle`** | `ViewStyle` | Y · M · D caption row. |
| **`dateFieldCaptionTextStyle`** | `TextStyle` | Caption labels. |
| **`dateWheelAreaStyle`** | `ViewStyle` | Wheels container. |
| **`dateWheelAreaBackgroundColor`** | `string` | Wheel area background. |
| **`dateSelectionLaneStyle`** | `ViewStyle` | Selection band overlay. |
| **`dateSelectionLaneBackgroundColor`** | `string` | Selection band tint. |

### 7) Theme

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| **`colorScheme`** | `'light' \| 'dark' \| 'system'` | `'light'` | **`dark`** — dark defaults for wheels & headers; with **`presentation="sheet"`**, also card, grabber, title, close/done. **`system`** uses React Native **`useColorScheme`**. Your own `*Style` / `*BackgroundColor` props still merge on top. |

### 8) Bottom sheet (`presentation="sheet"`)

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| **`presentation`** | `'inline' \| 'sheet'` | `'inline'` | **`sheet`** wraps picker in **`Modal`** with backdrop & chrome. |
| **`sheetVisible`** | `boolean` | — | Controlled visibility when **`sheet`**. |
| **`onSheetVisibleChange`** | `(visible: boolean) => void` | — | Open/close callback. |
| **`sheetAnimationType`** | `'none' \| 'slide' \| 'fade'` | **`'none'`** | Forwarded to **`Modal`**; **`none`** avoids conflicting with built-in sheet motion. |
| **`sheetStatusBarTranslucent`** | `boolean` | — | **`Modal`** prop (Android). |
| **`sheetBackdropDismissDisabled`** | `boolean` | `false` | If **`true`**, backdrop tap does not close. |
| **`sheetBackdropStyle`** | `ViewStyle` | — | Full-screen dim layer (merged with animated opacity). |
| **`sheetRootStyle`** | `ViewStyle` | — | Root **`View`** inside **`Modal`**. |
| **`sheetContainerStyle`** | `ViewStyle` | — | Column pinning card (**`flex-end`**); use **`justifyContent: 'center'`** for mid-screen. |
| **`sheetCardStyle`** | `ViewStyle` | — | Rounded panel (background, radius, **`maxHeight`**, padding). |
| **`sheetHeaderRowStyle`** | `ViewStyle` | — | Title + trailing control row. |
| **`sheetTitle`** | `ReactNode` | — | Header title (string → **`Text`** + **`sheetTitleStyle`**). |
| **`sheetTitleStyle`** | `TextStyle` | — | Title typography. |
| **`sheetShowHeader`** | `boolean` | `true` | **`false`** hides default header (title + ×/Done); use backdrop/back or custom **`renderSheetHeader`**. |
| **`sheetShowGrabber`** | `boolean` | `true` | **`false`** hides drag **handle bar** only. |
| **`sheetAnimateTransitions`** | `boolean` | `true` | **`false`** = instant open/close & swipe dismiss (no spring/timing). |
| **`sheetHeaderTrailing`** | `'close' \| 'done'` | `'close'` | × vs text button. |
| **`sheetShowDoneButton`** | `boolean` | `true` | Show trailing dismiss control. |
| **`sheetDoneLabel`** | `string` | `'Done'` | When **`sheetHeaderTrailing="done"`**. |
| **`sheetDoneTextStyle`** | `TextStyle` | — | Done button text. |
| **`sheetCloseButtonStyle`** | `ViewStyle` | — | × **`Pressable`** wrapper. |
| **`sheetCloseIconStyle`** | `TextStyle` | — | × glyph. |
| **`sheetCloseAccessibilityLabel`** | `string` | `'Close'` | |
| **`sheetDoneHitSlop`** | `number` | `12` | Touch slop for × / Done. |
| **`onSheetDonePress`** | `() => void` | — | Fires before sheet closes (× / Done / programmatic exit). |
| **`sheetSwipeToDismiss`** | `boolean` | `true` | Drag handle / title strip to dismiss. |
| **`sheetSwipeDismissThreshold`** | `number` | `72` | Min downward drag (px). |
| **`sheetSwipeDismissVelocity`** | `number` | `0.35` | Flick velocity (px/ms) helper. |
| **`sheetPickerWrapperStyle`** | `ViewStyle` | — | Padding around picker inside card. |
| **`renderSheetHeader`** | `() => ReactNode` | — | Replaces default header; swipe uses this region (**`move`** pan). |

---

## Related types (exported)

| Type | Purpose |
| ---- | ------- |
| `DualPickerValue` | `string \| number` wheel entry. |
| `DualPickerRange` | `{ start, end }` for non-date modes. |
| `CalendarDateParts` | `{ year, month, day }`. |
| `CalendarDatePartsInput` | Partial parts for **`value`**. |
| `DualPickerCalendarRange` | `{ start: CalendarDateParts, end: ... }`. |
| `DualPickerCalendarRangeInput` | Partial halves for **`value`**. |
| `DualPickerDateFormat` | `'iso' \| 'eu' \| 'us'`. |
| `DualPickerPresentation` | `'inline' \| 'sheet'`. |
| `DualPickerColorScheme` | `'light' \| 'dark' \| 'system'`. |
| `DualPickerChangeReason` | Why **`onChange`** fired. |
| `DualPickerGapBasis` | `'value' \| 'index'`. |
| `DualPickerClampBehavior` | `'push-end' \| 'push-start' \| 'lock'`. |
| `DualPickerNativeScrollEventLike` | Scroll event shape for hooks. |

---

## `PickerColumn` & `useDualPicker`

Use these when you build a **custom** layout (one wheel, different chrome, your own second column). **`DualPicker`** already composes two **`PickerColumn`**s for you.

### `PickerColumnProps` (one scroll wheel)

| Prop | Type | Description |
| ---- | ---- | ----------- |
| **`values`** | `DualPickerValue[]` | Wheel data. |
| **`selectedValue`** | `DualPickerValue` | Committed value. |
| **`itemHeight`** | `number` | Row height. |
| **`visibleItemCount`** | `number` | Visible rows (odd). |
| **`formatValue`** | `(v) => string` | Label formatter. |
| **`onWheelSettled`** | `(PickerWheelSettledPayload) => void` | After snap (use this, not raw scroll). |
| **`onMomentumScrollEnd`** | — | Deprecated. |
| **`testID`** | `string` | Testing. |
| **`valueTextStyle`** / **`selectedValueTextStyle`** | `TextStyle` | |
| **`valueCellStyle`** / **`selectedValueCellStyle`** | `ViewStyle` | |

**`PickerColumnHandle`**: `{ scrollToOffset(y, animated) }`.

**`useDualPicker`** — headless logic for custom two-column UIs (see source / typings).

**`formatDualPickerTimeMinutes(value, use12Hour)`** — exported helper for matching time labels outside the picker.

---

## Example app

```bash
yarn example start
```

`example/src/App.tsx` — every preset, **`presentation="sheet"`**, **`colorScheme="system"`** on the sheet, inline **dark** demo, date ISO/EU/US, 24h/12h time.

---

## Integrations

- **Built-in sheet** — set **`presentation="sheet"`** + **`sheetVisible`** / **`onSheetVisibleChange`** (see props above).  
- **Your own `Modal`** — render **`presentation="inline"`** inside your shell.  
- **`@gorhom/bottom-sheet`** — use **`inline`** picker inside **`BottomSheetView`**; adjust gestures if wheels conflict (see their docs).

---

## License

MIT — [LICENSE](./LICENSE).

---

## Links

- [Repository](https://github.com/MaharMudasar532/react-native-dual-picker)  
- [Issues](https://github.com/MaharMudasar532/react-native-dual-picker/issues)  
- [npm](https://www.npmjs.com/package/react-native-dual-picker)  
