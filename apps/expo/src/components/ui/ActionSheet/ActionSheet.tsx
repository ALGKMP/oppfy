import React, { useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
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
  imageUrl?: string | ImageSourcePropType;
  title?: string;
  titleProps?: SizableTextProps;
  subtitle?: string;
  subtitleProps?: ParagraphProps;
  buttonOptions: ButtonOption[];
  isVisible: boolean;
  onCancel?: () => void;
}

export const ActionSheet = ({
  imageUrl,
  title,
  titleProps,
  subtitle,
  subtitleProps,
  buttonOptions,
  isVisible,
  onCancel,
}: ActionSheetProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const animation = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      animation.value = withSpring(1, { damping: 15, stiffness: 200 });
    } else {
      animation.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished && onCancel) {
          runOnJS(onCancel)();
        }
      });
    }
  }, [isVisible, animation, onCancel]);

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
  }, [onCancel]);

  const handleOptionPress = useCallback(
    (option: ButtonOption) => {
      if (!option.disabled) {
        option.onPress?.();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (option.autoClose !== false) {
          handleCancel();
        }
      }
    },
    [handleCancel],
  );

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animation.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          animation.value,
          [0, 1],
          [300, 0],
          Extrapolation.CLAMP,
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
        {/* Animated Backdrop */}
        <Animated.View style={[styles.backdrop, backgroundStyle]}>
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
              <React.Fragment key={index}>
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
