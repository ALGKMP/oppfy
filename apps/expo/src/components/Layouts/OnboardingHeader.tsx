import { useMemo } from "react";
import { Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View, XStack, YStack } from "~/components/ui";

const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;
const SEGMENT_HEIGHT = 6;

const AnimatedView = Animated.createAnimatedComponent(View);

interface ProgressSegmentProps {
  isActive: boolean;
  index: number;
  totalSteps: number;
}

function ProgressSegment({ isActive }: ProgressSegmentProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: withTiming(isActive ? "100%" : "0%", {
        duration: 400,
      }),
      backgroundColor: "#fff",
      borderRadius: SEGMENT_HEIGHT,
      opacity: withTiming(isActive ? 1 : 0, { duration: 300 }),
    };
  }, [isActive]);

  return (
    <View
      flex={1}
      height={SEGMENT_HEIGHT}
      marginHorizontal="$1"
      overflow="hidden"
      backgroundColor="rgba(255,255,255,0.2)"
      borderRadius={SEGMENT_HEIGHT}
    >
      <AnimatedView style={animatedStyle} />
    </View>
  );
}

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const segments = useMemo(
    () =>
      Array.from({ length: totalSteps }, (_, i) => (
        <ProgressSegment
          key={i}
          isActive={i <= currentStep}
          index={i}
          totalSteps={totalSteps}
        />
      )),
    [currentStep, totalSteps],
  );

  return (
    <XStack
      width="100%"
      gap="$2"
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="$4"
    >
      {segments}
    </XStack>
  );
}

interface OnboardingHeaderProps {
  title?: string;
  HeaderLeft?: React.ReactNode;
  HeaderRight?: React.ReactNode;
  HeaderTitle?: React.ReactNode;
  progress?: {
    currentStep: number;
    totalSteps: number;
  };
}

export function OnboardingHeader({
  title,
  HeaderLeft,
  HeaderRight,
  HeaderTitle,
  progress,
}: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();

  const content =
    HeaderTitle ??
    (title && (
      <Text fontSize="$6" fontWeight="bold" color="$white">
        {title}
      </Text>
    ));

  return (
    <YStack paddingTop={insets.top}>
      <XStack
        height={HEADER_HEIGHT}
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
      >
        <View flex={1} alignItems="flex-start">
          {HeaderLeft}
        </View>

        <View flex={4} alignItems="center" justifyContent="center">
          {progress ? (
            <View width="100%">
              <OnboardingProgress {...progress} />
            </View>
          ) : (
            content
          )}
        </View>

        <View flex={1} alignItems="flex-end">
          {HeaderRight}
        </View>
      </XStack>
    </YStack>
  );
}
