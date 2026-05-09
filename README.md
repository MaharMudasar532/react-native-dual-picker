# React Native Dual Picker (Range, Date, Bottom Sheet)

**Dual wheel picker** for **React Native** (iOS & Android): choose a **from** and **to** value with two side‑by‑side **scroll wheels**. Supports **numeric range**, **date / calendar range** (year · month · day), **month**, **day of month**, **weekday**, **year**, **alphabet**, and **decimal** modes—with **min/max gap** rules, **clamp** behaviors, optional **bottom sheet** presentation, and full **TypeScript** typings.

> **Keywords:** `react-native` · `dual-picker` · `range-picker` · `wheel-picker` · `scroll-picker` · `date-range-picker` · `calendar-picker` · `month-picker` · `day-picker` · `bottom-sheet` · `two-column-picker` · `from-to-picker` · `react-native-ui` · `ios` · `android`

React Native Dual Picker is a production-ready **React Native range picker** and **date range picker** with dual wheels, optional **bottom sheet picker** presentation, and full TypeScript support for iOS and Android apps.

<!--
  Media URLs must be absolute: npmjs.com and many previews do not resolve ./relative paths.
  Primary: github.com/.../raw/master (works for public repos in most browsers).
  If images 404: push `master`, confirm files exist at repo root, or swap owner/repo for your fork.
  Optional mirror (public repos): https://cdn.jsdelivr.net/gh/MaharMudasar532/react-native-dual-picker@master/withoutbottom.gif
-->

---

## Demos (GIFs)

<p align="center">
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/withoutbottom.gif" alt="Dual picker inline demo — without bottom sheet" width="47%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/bottomsheet.gif" alt="Dual picker bottom sheet demo" width="47%" />
</p>

<p align="center"><em>Left: inline picker · Right: bottom sheet picker.</em></p>

---

## Screenshots

<p align="center">
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/Screenshot_1778299828.png" alt="Dual picker — presets and calendar modes" width="32%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/Screenshot_1778299830.png" alt="Dual picker — date wheels ISO EU US" width="32%" />
  &nbsp;
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/Screenshot_1778299832.png" alt="Dual picker — From To numeric range" width="32%" />
</p>

<p align="center">
  <sub>Row 1: presets / calendar · date layouts · From–To range</sub>
</p>

<p align="center">
  <img src="https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/Screenshot_1778300880.png" alt="Dual picker — bottom sheet with grabber, title, close, wheels" width="70%" />
</p>

<p align="center">
  <sub>Bottom sheet: drag handle, centered title, × dismiss, synchronized wheels</sub>
</p>

### Media URLs (GIF & PNGs)

**Yes — for a normal public GitHub repo they are addressed:** every image uses an absolute URL to **`master`** on  
`https://github.com/MaharMudasar532/react-native-dual-picker/raw/master/…`  
so the README renders on **GitHub**, **npm**, and most previews (unlike `./relative.png`, which npm cannot resolve).

If a thumbnail still breaks: confirm the repo is **public**, the files exist on **`master`**, and you are not behind a network that blocks `github.com`/`raw`. For a **fork**, replace **`MaharMudasar532/react-native-dual-picker`** with your **`owner/repo`**. Optional CDN mirror (same files):  
`https://cdn.jsdelivr.net/gh/MaharMudasar532/react-native-dual-picker@master/withoutbottom.gif` (swap the filename for each asset).

---

## Features

- Two wheels (**From** / **To** or **Start** / **End**) with shared selection lane  
- **`minGap` / `maxGap`** — numeric or index-based (`gapBasis`); **`mode="date"`** uses whole **UTC** days (skipped when **`enforceRangeGap={false}`**)  
- **`enforceRangeGap`** — default **`true`**: forward range; set **`false`** for independent wheels (**`end` may be smaller than `start`**)  
- **Calendar mode** — six wheels, **ISO / EU / US** column order, localized months  
- **Partial `value`** for date mode + **`modeOptions.defaultCalendar*`** fallbacks + local “today”  
- **`presentation="sheet"`** — modal, animated backdrop, swipe-to-dismiss, customizable chrome  
- **`PickerColumn`**, **`useDualPicker`** for custom UIs  

---

## SEO Keywords

Useful search terms this package targets:

- `react native range picker`
- `react native date range picker`
- `react native dual wheel picker`
- `react native bottom sheet picker`
- `react native from to picker`
- `react native calendar range picker`

---

## Installation

```bash
yarn add react-native-dual-picker
# or
npm install react-native-dual-picker
```

Peers: **`react`**, **`react-native`** (see `package.json`).

---

## Quick start

```tsx
import { DualPicker } from 'react-native-dual-picker';

<DualPicker
  mode="range"
  data={[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
  value={{ start: 10, end: 18 }}
  minGap={1}
  maxGap={12}
  onChange={(range) => console.log(range)}
/>
```

### Calendar (`mode="date"`)

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
  maxGap={400}
  onChange={(range) => console.log(range)}
/>
```

Helpers (exported): **`normalizeDualPickerCalendarValue(value, modeOptions, minGap, maxGap?, enforceRangeGap?)`**, **`resolveDualPickerCalendarInput`**, **`nowLocalCalendarParts`**, **`calendarYearBoundsFromOptions`**.

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

### Bottom sheet (`presentation="sheet"`)

With **`presentation="sheet"`**, `DualPicker` wraps the picker in React Native’s **`Modal`**: dimmed **backdrop**, **grabber**, **header** (title + close or Done), and optional **swipe-down** dismiss. Use **controlled** visibility: **`sheetVisible`** + **`onSheetVisibleChange`**.

Mount **one** sheet instance (often near the root of the screen); open it with **`setOpen(true)`**. Tapping the **backdrop** closes by default (set **`sheetBackdropDismissDisabled`** to disable). **`onSheetDonePress`** runs only when the user dismisses via the **header × or Done** button — not when closing from the backdrop, swipe-to-dismiss, or Android back (`onRequestClose`).

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DualPicker } from 'react-native-dual-picker';

const DATA = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function SheetExample() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState({ start: 10, end: 18 });

  return (
    <View style={styles.screen}>
      <Pressable style={styles.openBtn} onPress={() => setOpen(true)}>
        <Text style={styles.openBtnText}>Open range picker</Text>
      </Pressable>

      <DualPicker
        mode="range"
        data={DATA}
        value={value}
        minGap={1}
        maxGap={12}
        clampBehavior="push-end"
        autoShiftEnd
        startLabel="From"
        endLabel="To"
        formatValue={(v) => String(v)}
        presentation="sheet"
        sheetVisible={open}
        onSheetVisibleChange={setOpen}
        sheetTitle="Choose range"
        sheetTitleStyle={styles.sheetTitle}
        sheetBackdropStyle={styles.sheetBackdrop}
        sheetCardStyle={styles.sheetCard}
        sheetPickerWrapperStyle={styles.sheetPickerPad}
        sheetHeaderTrailing="close"
        sheetSwipeToDismiss
        onSheetDonePress={() => {
          /* optional: runs only when user taps × or Done (not backdrop / swipe) */
        }}
        onChange={(next) => setValue(next as typeof value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: 'center' },
  openBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
  },
  openBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sheetBackdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetCard: {
    backgroundColor: '#E8E8ED',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetPickerPad: { paddingHorizontal: 8, marginBottom: 4 },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    color: '#1C1C1E',
  },
});
```

**Calendar in a sheet:** same pattern — set **`mode="date"`**, pass **`modeOptions`**, and keep **`presentation="sheet"`** + **`sheetVisible`** / **`onSheetVisibleChange`**. See **`example/src/App.tsx`** for a second `DualPicker` that mirrors the inline preset in sheet form.

### Alphabet, decimal, month (preset modes)

```tsx
<DualPicker
  mode="alphabet"
  value={{ start: 'a', end: 'f' }}
  minGap={1}
  maxGap={10}
  onChange={(r) => console.log(r)}
/>

<DualPicker
  mode="decimal"
  modeOptions={{ decimalFrom: 0, decimalTo: 2, decimalStep: 0.1 }}
  value={{ start: 0, end: 0.5 }}
  minGap={1}
  maxGap={8}
  onChange={(r) => console.log(r)}
/>

<DualPicker
  mode="month"
  modeOptions={{ monthStyle: 'number' }}
  value={{ start: 3, end: 9 }}
  minGap={1}
  maxGap={24}
  onChange={(r) => console.log(r)}
/>
```

### Partial calendar `value` + normalization helper

Halves may omit `year` / `month` / `day`; defaults come from **`modeOptions.defaultCalendar*`** then **today** (local). To display a canonical range in your UI:

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

const raw = {
  start: {},
  end: {},
};

const canonical = normalizeDualPickerCalendarValue(raw, modeOptions, 1, 400);
// canonical.start / canonical.end are full { year, month, day }
```

The runnable **preset matrix** (chips for every mode, ISO/EU/US, and a second **sheet** instance) lives in **`example/src/App.tsx`**.

---

## Modes (`mode`)

| Value | Description |
| ----- | ----------- |
| `range` | Numeric list from **`data`** (prefer over legacy `dual`). |
| `dual` | Legacy alias for **`range`**. |
| `date` | Six calendar wheels (start/end × Y/M/D). |
| `day` | Day-of-month list (`modeOptions.dayFrom` / `dayTo`). |
| `month` | Month list (`monthStyle`, `monthLocale`). |
| `year` | Year list (`yearFrom`, `yearTo`). |
| `weekday` | Weekday list (`weekdayStyle`, `weekdayLocale`, `weekdayFirstDay`). |
| `alphabet` | a–z / A–Z (`alphabetUpperCase`). |
| `decimal` | Stepped decimals (`decimalFrom`, `decimalTo`, `decimalStep`). |

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

---

## `DualPickerProps` — full reference

### Behavior & data

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| **`mode`** | `DualPickerMode` | **required** | Wheel preset (see table above). |
| **`value`** | `DualPickerRange` \| `DualPickerCalendarRange` \| `DualPickerCalendarRangeInput` | **required** | For **`date`**, halves may omit `year`/`month`/`day`; resolved via **`modeOptions.defaultCalendar*`** then local date. **`onChange`** always receives full `DualPickerCalendarRange`. |
| **`onChange`** | `(range, meta?) => void` | — | `meta.reason`: `DualPickerChangeReason`. |
| **`data`** | `DualPickerValue[]` | — | Required for **`range`** / **`dual`**. |
| **`modeOptions`** | `DualPickerModeOptions` | — | Bounds & locales for preset modes. |
| **`minGap`** / **`maxGap`** | `number` | — | Min/max spacing between start and end (meaning depends on **`gapBasis`** and mode). Ignored when **`enforceRangeGap={false}`**. |
| **`enforceRangeGap`** | `boolean` | `true` | **`false`** = independent wheels; **`end` may be smaller than `start`**; gap props ignored. |
| **`gapBasis`** | `'value' \| 'index'` | auto | **`index`** if any datum is a string, else **`value`**. |
| **`step`** | `number` | — | Optional step for **`range`** numeric data. |
| **`clampBehavior`** | `'push-end' \| 'push-start' \| 'lock'` | — | How to satisfy gap when one end moves. |
| **`autoShiftEnd`** | `boolean` | `true` | If **`push-end`**, moving start can push end forward. |
| **`formatValue`** | `(DualPickerValue) => string` | — | Wheel label formatter. |

### Layout & shared styling

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

### Two-wheel only (`dualWheel*` — ignored when `mode="date"`)

| Prop | Type | Description |
| ---- | ---- | ----------- |
| **`dualWheelDividerStyle`** | `ViewStyle` | Vertical rule between columns. |
| **`dualWheelWheelAreaStyle`** | `ViewStyle` | Wheel viewport. |
| **`dualWheelWheelAreaBackgroundColor`** | `string` | Shortcut for wheel area background. |
| **`dualWheelSelectionLaneStyle`** | `ViewStyle` | Center lane + hairlines. |
| **`dualWheelSelectionLaneBackgroundColor`** | `string` | Lane tint. |
| **`dualWheelStartSelectedTextStyle`** / **`dualWheelEndSelectedTextStyle`** | `TextStyle` | Committed text per wheel. |
| **`dualWheelStartSelectedCellStyle`** / **`dualWheelEndSelectedCellStyle`** | `ViewStyle` | Committed cell per wheel. |

### Date mode only (`date*`)

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

### Bottom sheet (`presentation="sheet"`)

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
| `DualPickerChangeReason` | Why **`onChange`** fired. |
| `DualPickerGapBasis` | `'value' \| 'index'`. |
| `DualPickerClampBehavior` | `'push-end' \| 'push-start' \| 'lock'`. |
| `DualPickerNativeScrollEventLike` | Scroll event shape for hooks. |

---

## `PickerColumn` & `useDualPicker`

### `PickerColumnProps`

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

---

## Example app

```bash
yarn example start
```

`example/src/App.tsx` — presets, **`presentation="sheet"`**, date formats, bottom-sheet button.

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
