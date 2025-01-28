import { useMemo } from "react";
import { Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Info } from "@tamagui/lucide-icons";
import { getTokens } from "tamagui";

import { Button, View, XStack, YStack } from "~/components/ui";

const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;
const SEGMENT_HEIGHT = 4;

const AnimatedView = Animated.createAnimatedComponent(View);

interface ProgressSegmentProps {
  isActive: boolean;
  index: number;
  totalSteps: number;
}

function ProgressSegment({ isActive }: ProgressSegmentProps) {
  const tokens = getTokens();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: withTiming(isActive ? "100%" : "0%", {
        duration: 600,
      }),
      backgroundColor: tokens.color.primary.val,
      borderRadius: SEGMENT_HEIGHT / 2,
    };
  }, [isActive]);

  return (
    <View
      flex={1}
      height={SEGMENT_HEIGHT}
      marginHorizontal="$1"
      overflow="hidden"
      backgroundColor="$gray6"
      borderRadius={SEGMENT_HEIGHT / 2}
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
    <XStack flex={1} maxWidth={280} marginHorizontal="$4" gap="$1">
      {segments}
    </XStack>
  );
}

interface OnboardingHeaderProps {
  showBack?: boolean;
  customLeftButton?: React.ReactNode;
  onInfoPress?: () => void;
  progress?: {
    currentStep: number;
    totalSteps: number;
  };
}

export function OnboardingHeader({
  showBack = true,
  customLeftButton,
  onInfoPress,
  progress,
}: OnboardingHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <YStack
      paddingTop={insets.top}
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$gray6"
    >
      <XStack
        height={HEADER_HEIGHT}
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack width="$5">
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

        {progress && <OnboardingProgress {...progress} />}

        <XStack width="$5" justifyContent="flex-end">
          {onInfoPress && (
            <Button
              chromeless
              icon={<Info size={24} />}
              onPress={onInfoPress}
              scaleIcon={1}
              opacity={0.7}
            />
          )}
        </XStack>
      </XStack>
    </YStack>
  );
}
