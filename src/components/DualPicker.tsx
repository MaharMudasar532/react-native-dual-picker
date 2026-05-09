import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ScaledSize } from 'react-native';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PanResponderGestureState } from 'react-native';
import type { DualPickerProps } from '../types';
import { omitSheetPresentationProps } from '../utils/omitSheetPresentationProps';
import { DualPickerCalendar } from './DualPickerCalendar';
import { DualPickerRangeView } from './DualPickerRangeView';

const SIDE_TOUCH = 44;
const BACKDROP_MAX_OPACITY = 0.4;
const EXIT_MS = 240;
const ENTER_BACKDROP_MS = 280;

const defaultSheetStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  sheetColumn: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  grabberRow: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C7C7CC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 12,
    minHeight: SIDE_TOUCH,
  },
  headerSide: {
    width: SIDE_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titlePanStrip: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.41,
    textAlign: 'center',
  },
  done: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
  },
  closeGlyph: {
    fontSize: 22,
    fontWeight: '300',
    color: '#3C3C43',
    lineHeight: 24,
    marginTop: -2,
  },
});

type SwipeOpts = {
  enabled: boolean;
  threshold: number;
  velocity: number;
};

function createSheetPanResponder(
  translateY: Animated.Value,
  backdropOpacity: Animated.Value,
  optsRef: React.MutableRefObject<SwipeOpts>,
  onVisibleRef: React.MutableRefObject<
    ((visible: boolean) => void) | undefined
  >,
  screenHRef: React.MutableRefObject<number>,
  animateRef: React.MutableRefObject<boolean>,
  strategy: 'grabber' | 'move'
) {
  const grant = () => {
    translateY.stopAnimation();
    backdropOpacity.stopAnimation();
  };

  const move = (_e: unknown, g: PanResponderGestureState) => {
    if (g.dy > 0) {
      translateY.setValue(g.dy);
    } else {
      translateY.setValue(0);
    }
  };

  const runExitParallel = (onFinish: () => void) => {
    const h = screenHRef.current;
    if (!animateRef.current) {
      backdropOpacity.setValue(0);
      translateY.setValue(h + 48);
      onFinish();
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: EXIT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: h + 48,
        duration: EXIT_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onFinish();
    });
  };

  const release = (_e: unknown, g: PanResponderGestureState) => {
    const { enabled, threshold, velocity } = optsRef.current;
    if (!enabled) {
      if (!animateRef.current) {
        translateY.setValue(0);
        return;
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      return;
    }
    const dismiss = g.dy > threshold || (g.vy > velocity && g.dy > 24);
    if (dismiss) {
      runExitParallel(() => {
        onVisibleRef.current?.(false);
      });
    } else if (!animateRef.current) {
      translateY.setValue(0);
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }).start();
    }
  };

  const terminate = () => {
    if (!animateRef.current) {
      translateY.setValue(0);
      return;
    }
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  if (strategy === 'grabber') {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => optsRef.current.enabled,
      onPanResponderGrant: grant,
      onPanResponderMove: move,
      onPanResponderRelease: release,
      onPanResponderTerminate: terminate,
    });
  }

  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => {
      if (!optsRef.current.enabled) return false;
      return g.dy > 5 && g.dy > Math.abs(g.dx) * 1.05;
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: grant,
    onPanResponderMove: move,
    onPanResponderRelease: release,
    onPanResponderTerminate: terminate,
  });
}

type SheetModalProps = DualPickerProps & { innerBody: ReactNode };

function DualPickerSheetModal(props: SheetModalProps) {
  const {
    innerBody,
    sheetVisible = false,
    onSheetVisibleChange,
    sheetAnimationType: sheetAnimationTypeProp,
    sheetStatusBarTranslucent,
    sheetBackdropDismissDisabled = false,
    sheetBackdropStyle,
    sheetRootStyle,
    sheetContainerStyle,
    sheetCardStyle,
    sheetHeaderRowStyle,
    sheetTitle,
    sheetTitleStyle,
    sheetShowHeader = true,
    sheetShowGrabber = true,
    sheetHeaderTrailing = 'close',
    sheetShowDoneButton = true,
    sheetDoneLabel = 'Done',
    sheetDoneTextStyle,
    sheetCloseButtonStyle,
    sheetCloseIconStyle,
    sheetCloseAccessibilityLabel = 'Close',
    sheetDoneHitSlop = 12,
    onSheetDonePress,
    sheetPickerWrapperStyle,
    renderSheetHeader,
    sheetSwipeToDismiss = true,
    sheetSwipeDismissThreshold = 72,
    sheetSwipeDismissVelocity = 0.35,
    sheetAnimateTransitions = true,
  } = props;

  /** `slide`/`fade` on Modal fights our sheet motion — default `none` for smooth open/close. */
  const sheetAnimationType = sheetAnimationTypeProp ?? 'none';

  const screenHRef = useRef(Dimensions.get('window').height);
  const translateY = useRef(new Animated.Value(screenHRef.current)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const onSheetVisibleChangeRef = useRef(onSheetVisibleChange);
  onSheetVisibleChangeRef.current = onSheetVisibleChange;

  const swipeOptsRef = useRef<SwipeOpts>({
    enabled: true,
    threshold: 72,
    velocity: 0.35,
  });
  swipeOptsRef.current = {
    enabled: sheetSwipeToDismiss !== false,
    threshold: sheetSwipeDismissThreshold,
    velocity: sheetSwipeDismissVelocity,
  };

  const animateTransitionsRef = useRef(true);
  animateTransitionsRef.current = sheetAnimateTransitions !== false;

  useEffect(() => {
    const sub = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        screenHRef.current = window.height;
      }
    );
    return () => sub.remove();
  }, []);

  const runEnterAnimation = useCallback(() => {
    const h = screenHRef.current;
    translateY.stopAnimation();
    backdropOpacity.stopAnimation();
    if (!animateTransitionsRef.current) {
      translateY.setValue(0);
      backdropOpacity.setValue(1);
      return;
    }
    translateY.setValue(h);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: ENTER_BACKDROP_MS,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 68,
      }),
    ]).start();
  }, [backdropOpacity, translateY]);

  const runExitThenHide = useCallback(
    (afterClose?: () => void) => {
      const h = screenHRef.current;
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
      if (!animateTransitionsRef.current) {
        backdropOpacity.setValue(0);
        translateY.setValue(h + 48);
        afterClose?.();
        onSheetVisibleChangeRef.current?.(false);
        return;
      }
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: EXIT_MS,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: h + 48,
          duration: EXIT_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          afterClose?.();
          onSheetVisibleChangeRef.current?.(false);
        }
      });
    },
    [backdropOpacity, translateY]
  );

  useEffect(() => {
    if (sheetVisible) {
      runEnterAnimation();
    }
  }, [sheetVisible, runEnterAnimation]);

  const grabberPan = useMemo(
    () =>
      createSheetPanResponder(
        translateY,
        backdropOpacity,
        swipeOptsRef,
        onSheetVisibleChangeRef,
        screenHRef,
        animateTransitionsRef,
        'grabber'
      ),
    [translateY, backdropOpacity]
  );

  const movePan = useMemo(
    () =>
      createSheetPanResponder(
        translateY,
        backdropOpacity,
        swipeOptsRef,
        onSheetVisibleChangeRef,
        screenHRef,
        animateTransitionsRef,
        'move'
      ),
    [translateY, backdropOpacity]
  );

  const swipeOn =
    sheetSwipeToDismiss !== false ? grabberPan.panHandlers : undefined;
  const swipeMoveOn =
    sheetSwipeToDismiss !== false ? movePan.panHandlers : undefined;
  const swipeEnabled = sheetSwipeToDismiss !== false;
  const grabberEnabled = sheetShowGrabber !== false && swipeEnabled;

  const backdropAnimatedStyle = {
    opacity: backdropOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [0, BACKDROP_MAX_OPACITY],
    }),
  };

  const handleDismiss = () => {
    onSheetDonePress?.();
    runExitThenHide();
  };

  const handleBackdrop = () => {
    if (sheetBackdropDismissDisabled) return;
    runExitThenHide();
  };

  const hitSlop =
    typeof sheetDoneHitSlop === 'number'
      ? {
          top: sheetDoneHitSlop,
          bottom: sheetDoneHitSlop,
          left: sheetDoneHitSlop,
          right: sheetDoneHitSlop,
        }
      : sheetDoneHitSlop;

  let header: ReactNode = null;
  let grabber: ReactNode = null;

  if (renderSheetHeader) {
    header = renderSheetHeader();
  } else if (sheetShowHeader) {
    /**
     * Keep top chrome minimal:
     * - If grabber is active (swipe enabled), hide trailing close/done.
     * - If swipe is disabled, hide grabber and show trailing control.
     */
    const showTrailing = sheetShowDoneButton !== false && !grabberEnabled;

    const trailing = !showTrailing ? null : sheetHeaderTrailing === 'done' ? (
      <View style={defaultSheetStyles.headerSide}>
        <Pressable
          onPress={handleDismiss}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={sheetDoneLabel}
        >
          <Text style={[defaultSheetStyles.done, sheetDoneTextStyle]}>
            {sheetDoneLabel}
          </Text>
        </Pressable>
      </View>
    ) : (
      <View style={defaultSheetStyles.headerSide}>
        <Pressable
          onPress={handleDismiss}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={sheetCloseAccessibilityLabel}
          style={[defaultSheetStyles.closeButton, sheetCloseButtonStyle]}
        >
          <Text style={[defaultSheetStyles.closeGlyph, sheetCloseIconStyle]}>
            ×
          </Text>
        </Pressable>
      </View>
    );

    header = (
      <View style={[defaultSheetStyles.headerRow, sheetHeaderRowStyle]}>
        <View style={defaultSheetStyles.headerSide} />
        <View
          style={defaultSheetStyles.titlePanStrip}
          {...(!grabberEnabled ? (swipeMoveOn ?? {}) : {})}
          collapsable={false}
        >
          {sheetTitle != null ? (
            typeof sheetTitle === 'string' || typeof sheetTitle === 'number' ? (
              <Text
                style={[defaultSheetStyles.title, sheetTitleStyle]}
                numberOfLines={1}
              >
                {sheetTitle}
              </Text>
            ) : (
              sheetTitle
            )
          ) : null}
        </View>
        {trailing ?? <View style={defaultSheetStyles.headerSide} />}
      </View>
    );

    if (grabberEnabled) {
      grabber = (
        <View
          style={defaultSheetStyles.grabberRow}
          {...(swipeOn ?? {})}
          collapsable={false}
        >
          <View style={defaultSheetStyles.grabber} />
        </View>
      );
    }
  }

  const customHeaderWrapped = renderSheetHeader ? (
    <View {...(swipeMoveOn ?? {})} collapsable={false}>
      {header}
    </View>
  ) : null;

  return (
    <Modal
      visible={sheetVisible}
      animationType={sheetAnimationType}
      transparent
      onRequestClose={() => runExitThenHide()}
      statusBarTranslucent={sheetStatusBarTranslucent}
    >
      <View style={[defaultSheetStyles.root, sheetRootStyle]}>
        <Animated.View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}
        >
          <Pressable
            style={[defaultSheetStyles.backdrop, sheetBackdropStyle]}
            onPress={handleBackdrop}
          />
        </Animated.View>
        <View
          style={[defaultSheetStyles.sheetColumn, sheetContainerStyle]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              defaultSheetStyles.card,
              sheetCardStyle,
              { transform: [{ translateY }] },
            ]}
            collapsable={false}
          >
            {renderSheetHeader ? (
              customHeaderWrapped
            ) : sheetShowHeader ? (
              <>
                {grabber}
                {header}
              </>
            ) : null}
            <View style={sheetPickerWrapperStyle}>{innerBody}</View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

export function DualPicker(props: DualPickerProps) {
  const presentation = props.presentation ?? 'inline';
  const innerProps = omitSheetPresentationProps(props);

  const innerBody =
    props.mode === 'date' ? (
      <DualPickerCalendar {...innerProps} mode="date" />
    ) : (
      <DualPickerRangeView {...innerProps} />
    );

  if (presentation !== 'sheet') {
    return innerBody;
  }

  return <DualPickerSheetModal {...props} innerBody={innerBody} />;
}
