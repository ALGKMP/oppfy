import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "@tamagui/lucide-icons";

import { Button, H4, Text, View, XStack, YStack } from "./";

interface OnboardingHeaderProps {
  title: string;
  showBack?: boolean;
  customLeftButton?: React.ReactNode;
  progress?: {
    currentStep: number;
    totalSteps: number;
    showStepCount?: boolean;
  };
}

export function OnboardingHeader({
  title,
  showBack = true,
  customLeftButton,
  progress,
}: OnboardingHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const progress_value = useDerivedValue(() => {
    if (!progress) return 0;
    return withSpring((progress.currentStep + 1) / progress.totalSteps, {
      mass: 0.8,
      damping: 15,
      stiffness: 120,
    });
  }, [progress?.currentStep, progress?.totalSteps]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress_value.value * 100}%`,
  }));

  const stepIndicators = useMemo(() => {
    if (!progress) return null;
    return Array.from({ length: progress.totalSteps }, (_, i) => (
      <View
        key={i}
        width={6}
        height={6}
        borderRadius={3}
        backgroundColor={i <= progress.currentStep ? "$primary" : "$gray8"}
        opacity={i === progress.currentStep ? 1 : 0.5}
      />
    ));
  }, [progress?.currentStep, progress?.totalSteps]);

  return (
    <YStack
      entering={FadeIn.springify()}
      paddingTop={insets.top}
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$gray6"
    >
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack flex={1} alignItems="center">
          {customLeftButton ??
            (showBack && (
              <Button
                chromeless
                icon={<ChevronLeft size={24} />}
                onPress={router.back}
                scaleIcon={1}
                marginLeft="$-2"
              />
            ))}
        </XStack>

        <YStack
          position="absolute"
          left={0}
          right={0}
          alignItems="center"
          pointerEvents="none"
        >
          <H4 color="$gray12">{title}</H4>
          {progress?.showStepCount && (
            <Text color="$gray11" fontSize={13}>
              Step {progress.currentStep + 1} of {progress.totalSteps}
            </Text>
          )}
        </YStack>

        <XStack flex={1} justifyContent="flex-end">
          {progress && <XStack gap="$2">{stepIndicators}</XStack>}
        </XStack>
      </XStack>

      {progress && (
        <View height={3} backgroundColor="$gray6" overflow="hidden">
          <Animated.View style={[styles.progressBar, progressBarStyle]}>
            <View backgroundColor="$primary" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    height: "100%",
  },
});
