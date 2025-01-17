import React from "react";
import type { ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Portal } from "@gorhom/portal";
import type { ParagraphProps, SizableTextProps } from "tamagui";
import {
  Paragraph,
  Separator,
  SizableText,
  useTheme,
  View,
  YStack,
} from "tamagui";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);

export interface ButtonOption {
  text: string;
  textProps?: SizableTextProps;
  onPress?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  autoClose?: boolean;
}

export interface ActionSheetProps {
  id: string;
  imageUrl?: string | ImageSourcePropType;
  title?: string;
  titleProps?: SizableTextProps;
  subtitle?: string;
  subtitleProps?: ParagraphProps;
  buttonOptions: ButtonOption[];
  isVisible: boolean;
  onCancel?: () => void;
  onAnimationComplete?: (finished: boolean) => void;
}

const SPRING_CONFIG = {
  damping: 20,
  mass: 1,
  stiffness: 250,
} as const;

const TIMING_CONFIG = {
  duration: 250,
} as const;

export const ActionSheet = ({
  id,
  imageUrl,
  title,
  titleProps,
  subtitle,
  subtitleProps,
  buttonOptions,
  isVisible,
  onCancel,
  onAnimationComplete,
}: ActionSheetProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Separate animations for better control
  const slideAnimation = useSharedValue(0);
  const fadeAnimation = useSharedValue(0);
  const backdropAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (isVisible) {
      // Backdrop fades in first
      backdropAnimation.value = withTiming(1, { duration: 200 });
      // Then sheet slides up with spring physics
      slideAnimation.value = withSequence(
        withTiming(0.01, { duration: 50 }),
        withSpring(1, SPRING_CONFIG),
      );
      // Content fades in slightly delayed
      fadeAnimation.value = withTiming(1, { duration: 300 });
    } else {
      // Reverse animation sequence
      fadeAnimation.value = withTiming(0, { duration: 150 });
      slideAnimation.value = withTiming(0, TIMING_CONFIG);
      backdropAnimation.value = withTiming(0, TIMING_CONFIG, (finished) => {
        if (onAnimationComplete) {
          runOnJS(onAnimationComplete)(finished ?? false);
        }
      });
    }
  }, [
    isVisible,
    slideAnimation,
    fadeAnimation,
    backdropAnimation,
    onAnimationComplete,
  ]);

  const handleCancel = React.useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel?.();
  }, [onCancel]);

  const handleOptionPress = React.useCallback(
    (option: ButtonOption) => {
      if (!option.disabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        option.onPress?.();
        if (option.autoClose !== false) {
          handleCancel();
        }
      }
    },
    [handleCancel],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropAnimation.value,
    pointerEvents: backdropAnimation.value > 0 ? "auto" : "none",
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnimation.value,
    transform: [
      {
        translateY: interpolate(
          slideAnimation.value,
          [0, 1],
          [300, 0],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Portal>
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        justifyContent="flex-end"
        pointerEvents={isVisible ? "auto" : "none"}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View position="absolute" top={0} left={0} right={0} bottom={0} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Sheet Content */}
        <AnimatedYStack
          zIndex={1}
          width="100%"
          paddingHorizontal="$2"
          paddingBottom={insets.bottom}
          style={containerStyle}
          gap="$2"
        >
          <YStack borderRadius="$6" backgroundColor="$gray2" overflow="hidden">
            {(imageUrl ?? title ?? subtitle) && (
              <>
                <YStack
                  backgroundColor="$background"
                  padding="$4"
                  alignItems="center"
                  gap="$2"
                >
                  {imageUrl && (
                    <Image
                      source={imageUrl}
                      style={{ width: 100, height: 100, borderRadius: 50 }}
                    />
                  )}
                  {title && (
                    <SizableText
                      size="$6"
                      fontWeight="bold"
                      textAlign="center"
                      {...titleProps}
                    >
                      {title}
                    </SizableText>
                  )}
                  {subtitle && (
                    <Paragraph
                      textAlign="center"
                      theme="alt2"
                      {...subtitleProps}
                    >
                      {subtitle}
                    </Paragraph>
                  )}
                </YStack>
                <Separator />
              </>
            )}
            {buttonOptions.map((option, index) => (
              <React.Fragment key={`${id}-option-${index}`}>
                {index > 0 && <Separator />}
                <TouchableOpacity
                  onPress={() => handleOptionPress(option)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: theme.gray1.val,
                      opacity: option.disabled ? 0.5 : 1,
                    },
                  ]}
                  disabled={option.disabled}
                >
                  <View
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {option.icon && (
                      <View marginRight="$0.75">{option.icon}</View>
                    )}
                    <SizableText size="$5" {...option.textProps}>
                      {option.text}
                    </SizableText>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </YStack>
          <View
            backgroundColor="$background"
            overflow="hidden"
            borderRadius="$6"
          >
            <TouchableOpacity
              onPress={handleCancel}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.gray2.val,
                },
              ]}
            >
              <SizableText size="$5" color="$blue9">
                Cancel
              </SizableText>
            </TouchableOpacity>
          </View>
        </AnimatedYStack>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  optionButton: {
    padding: 16,
    alignItems: "center",
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
  },
});
