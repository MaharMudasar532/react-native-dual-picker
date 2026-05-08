import type { DualPickerProps } from '../types';

const SHEET_KEYS = new Set<string>([
  'presentation',
  'sheetVisible',
  'onSheetVisibleChange',
  'sheetAnimationType',
  'sheetStatusBarTranslucent',
  'sheetBackdropDismissDisabled',
  'sheetBackdropStyle',
  'sheetRootStyle',
  'sheetContainerStyle',
  'sheetCardStyle',
  'sheetHeaderRowStyle',
  'sheetTitle',
  'sheetTitleStyle',
  'sheetShowHeader',
  'sheetShowGrabber',
  'sheetAnimateTransitions',
  'sheetHeaderTrailing',
  'sheetShowDoneButton',
  'sheetDoneLabel',
  'sheetDoneTextStyle',
  'sheetCloseButtonStyle',
  'sheetCloseIconStyle',
  'sheetCloseAccessibilityLabel',
  'sheetDoneHitSlop',
  'onSheetDonePress',
  'sheetSwipeToDismiss',
  'sheetSwipeDismissThreshold',
  'sheetSwipeDismissVelocity',
  'sheetPickerWrapperStyle',
  'renderSheetHeader',
]);

/** Props safe to pass to [`DualPickerCalendar`](./DualPickerCalendar) / [`DualPickerRangeView`](./DualPickerRangeView) (no sheet chrome). */
export function omitSheetPresentationProps(
  props: DualPickerProps
): DualPickerProps {
  const out = { ...props } as Record<string, unknown>;
  for (const k of SHEET_KEYS) {
    delete out[k];
  }
  return out as unknown as DualPickerProps;
}
