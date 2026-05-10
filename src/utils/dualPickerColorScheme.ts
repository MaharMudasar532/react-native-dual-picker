import type {
  ColorSchemeName,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { DualPickerColorScheme, DualPickerProps } from '../types';

export function resolveDualPickerColorScheme(
  scheme: DualPickerColorScheme | undefined,
  system: ColorSchemeName | null | undefined
): 'light' | 'dark' {
  if (scheme === 'dark') return 'dark';
  if (scheme === 'system') return system === 'dark' ? 'dark' : 'light';
  return 'light';
}

function mergeStyle<T extends TextStyle | ViewStyle>(
  dark: T,
  existing: StyleProp<T> | undefined
): StyleProp<T> {
  if (existing == null) return dark;
  return [dark, existing] as StyleProp<T>;
}

const DARK_PICKER: Partial<DualPickerProps> = {
  headerLabelStyle: { color: '#AEAEB2' },
  valueTextStyle: { color: '#8E8E93' },
  selectedValueTextStyle: { color: '#FFFFFF' },
  unitTextStyle: { color: '#8E8E93' },
  dualWheelWheelAreaBackgroundColor: '#1C1C1E',
  dualWheelSelectionLaneBackgroundColor: 'rgba(255, 255, 255, 0.1)',
  dualWheelDividerStyle: { backgroundColor: 'rgba(84, 84, 88, 0.65)' },
  dateTitleStyle: { color: '#EBEBF5' },
  dateFieldCaptionTextStyle: { color: '#AEAEB2' },
  dateWheelAreaBackgroundColor: '#1C1C1E',
  dateSelectionLaneBackgroundColor: 'rgba(255, 255, 255, 0.1)',
  dateBetweenHalvesDividerStyle: {
    backgroundColor: 'rgba(84, 84, 88, 0.65)',
  },
};

/** Merges dark palette after caller props so explicit styles still win per-property where RN merges. */
export function mergeDarkModePickerProps(
  props: DualPickerProps
): DualPickerProps {
  const out = { ...props };

  out.headerLabelStyle = mergeStyle(
    DARK_PICKER.headerLabelStyle as TextStyle,
    props.headerLabelStyle
  );
  out.valueTextStyle = mergeStyle(
    DARK_PICKER.valueTextStyle as TextStyle,
    props.valueTextStyle
  );
  out.selectedValueTextStyle = mergeStyle(
    DARK_PICKER.selectedValueTextStyle as TextStyle,
    props.selectedValueTextStyle
  );
  out.unitTextStyle = mergeStyle(
    DARK_PICKER.unitTextStyle as TextStyle,
    props.unitTextStyle
  );
  out.dualWheelDividerStyle = mergeStyle(
    DARK_PICKER.dualWheelDividerStyle as ViewStyle,
    props.dualWheelDividerStyle
  );
  out.dateTitleStyle = mergeStyle(
    DARK_PICKER.dateTitleStyle as TextStyle,
    props.dateTitleStyle
  );
  out.dateFieldCaptionTextStyle = mergeStyle(
    DARK_PICKER.dateFieldCaptionTextStyle as TextStyle,
    props.dateFieldCaptionTextStyle
  );
  out.dateBetweenHalvesDividerStyle = mergeStyle(
    DARK_PICKER.dateBetweenHalvesDividerStyle as ViewStyle,
    props.dateBetweenHalvesDividerStyle
  );

  out.dualWheelWheelAreaBackgroundColor =
    props.dualWheelWheelAreaBackgroundColor ??
    DARK_PICKER.dualWheelWheelAreaBackgroundColor;
  out.dualWheelSelectionLaneBackgroundColor =
    props.dualWheelSelectionLaneBackgroundColor ??
    DARK_PICKER.dualWheelSelectionLaneBackgroundColor;
  out.dateWheelAreaBackgroundColor =
    props.dateWheelAreaBackgroundColor ??
    DARK_PICKER.dateWheelAreaBackgroundColor;
  out.dateSelectionLaneBackgroundColor =
    props.dateSelectionLaneBackgroundColor ??
    DARK_PICKER.dateSelectionLaneBackgroundColor;

  return out;
}

export type DualPickerSheetThemeChrome = {
  card: ViewStyle;
  grabber: ViewStyle;
  title: TextStyle;
  done: TextStyle;
  closeButton: ViewStyle;
  closeGlyph: TextStyle;
};

export function dualPickerSheetThemeChrome(
  scheme: 'light' | 'dark'
): DualPickerSheetThemeChrome {
  if (scheme === 'dark') {
    return {
      card: { backgroundColor: '#2C2C2E' },
      grabber: { backgroundColor: '#48484A' },
      title: { color: '#FFFFFF' },
      done: { color: '#0A84FF' },
      closeButton: { backgroundColor: 'rgba(235, 235, 245, 0.16)' },
      closeGlyph: { color: '#EBEBF5' },
    };
  }
  return {
    card: {},
    grabber: {},
    title: {},
    done: {},
    closeButton: {},
    closeGlyph: {},
  };
}
