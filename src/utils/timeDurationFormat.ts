import type { DualPickerValue } from '../types';

/**
 * Format minutes since midnight (0–1439) for `mode="time"` wheels.
 * @param use12Hour — from [`DualPickerProps.timeUse12Hour`](/) or `modeOptions.timeUse12Hour`
 */
export function formatDualPickerTimeMinutes(
  v: DualPickerValue,
  use12Hour: boolean
): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  const m = Math.round(((n % 1440) + 1440) % 1440);
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const mm = String(min).padStart(2, '0');
  if (!use12Hour) {
    return `${String(h24).padStart(2, '0')}:${mm}`;
  }
  const ap = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mm} ${ap}`;
}
