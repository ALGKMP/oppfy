import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Portal } from "@gorhom/portal";
import type { ParagraphProps, SizableTextProps } from "tamagui";
import { Paragraph, SizableText, useTheme, YStack } from "tamagui";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export interface DialogProps {
  title: string;
  titleProps?: SizableTextProps;
  subtitle?: string;
  subtitleProps?: ParagraphProps;
  isVisible: boolean;
  onAccept?: () => void;
  acceptText?: string;
  acceptTextProps?: SizableTextProps;
}

export const Dialog = ({
  title,
  titleProps,
  subtitle,
  subtitleProps,
  isVisible,
  onAccept,
  acceptText = "OK",
  acceptTextProps,
}: DialogProps) => {
  const theme = useTheme();
  const animation = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      animation.value = withSpring(1, { damping: 15, stiffness: 200 });
    } else {
      animation.value = withTiming(0, { duration: 250 });
    }
  }, [isVisible]);

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
        scale: interpolate(
          animation.value,
          [0, 1],
          [0.9, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  if (!isVisible) return null;

  return (
    <Portal>
      <Animated.View
        style={[styles.overlay, backgroundStyle]}
        pointerEvents={isVisible ? "auto" : "none"}
      >
        <AnimatedBlurView intensity={10} style={StyleSheet.absoluteFill} />
        <AnimatedYStack
          width={300}
          overflow="hidden"
          borderRadius="$6"
          alignItems="center"
          style={containerStyle}
        >
          <YStack
            width="100%"
            paddingVertical="$4"
            paddingHorizontal="$6"
            backgroundColor="$background"
            gap
          >
            <SizableText
              size="$6"
              fontWeight="bold"
              textAlign="center"
              {...titleProps}
            >
              {title}
            </SizableText>
            {subtitle && (
              <Paragraph textAlign="center" theme="alt2" {...subtitleProps}>
                {subtitle}
              </Paragraph>
            )}
          </YStack>
          <YStack backgroundColor="$gray2" width="100%">
            <YStack
              pressStyle={{ opacity: 0.7 }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAccept?.();
              }}
              backgroundColor="$gray1"
              padding="$3"
              alignItems="center"
            >
              <SizableText
                size="$5"
                color="$blue9"
                fontWeight="bold"
                {...acceptTextProps}
              >
                {acceptText}
              </SizableText>
            </YStack>
          </YStack>
        </AnimatedYStack>
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});
