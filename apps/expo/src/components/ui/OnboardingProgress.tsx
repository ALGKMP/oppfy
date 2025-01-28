import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { getTokens } from "tamagui";

import { H4, Text, View, XStack, YStack } from "./";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  showStepCount?: boolean;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepTitle,
  showStepCount = true,
}: OnboardingProgressProps) {
  const tokens = getTokens();

  const progress = useDerivedValue(() => {
    return withSpring((currentStep + 1) / totalSteps, {
      mass: 0.8,
      damping: 15,
      stiffness: 120,
    });
  }, [currentStep, totalSteps]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const stepIndicators = useMemo(
    () =>
      Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          width={8}
          height={8}
          borderRadius={4}
          backgroundColor={i <= currentStep ? "$primary" : "$gray8"}
          opacity={i === currentStep ? 1 : 0.5}
        />
      )),
    [currentStep, totalSteps],
  );

  return (
    <YStack
      entering={FadeIn.springify()}
      gap="$3"
      paddingHorizontal="$4"
      paddingVertical="$3"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <H4 color="$gray12">{stepTitle}</H4>
          {showStepCount && (
            <Text color="$gray11" fontSize="$3">
              Step {currentStep + 1} of {totalSteps}
            </Text>
          )}
        </YStack>
        <XStack gap="$2">{stepIndicators}</XStack>
      </XStack>

      <View
        height={3}
        backgroundColor="$gray6"
        borderRadius="$10"
        overflow="hidden"
      >
        <Animated.View style={[styles.progressBar, progressBarStyle]}>
          <LinearGradient
            colors={[tokens.color.primary.val, tokens.color.secondary.val]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </YStack>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: "100%",
  },
});
