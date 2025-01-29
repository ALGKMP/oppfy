import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronRight } from "@tamagui/lucide-icons";
import { getTokens } from "tamagui";

import { sharedValidators } from "@oppfy/validators";

import {
  Button,
  Input,
  ScreenView,
  Spinner,
  Text,
  XStack,
  YStack,
} from "~/components/ui";
import { api, isTRPCClientError } from "~/utils/api";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedXStack = Animated.createAnimatedComponent(XStack);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedInput = Animated.createAnimatedComponent(Input);

const PLACEHOLDERS = [
  "Select your birthday",
  "When were you born?",
  "Enter your birth date",
  "Choose your birthday",
];

enum Error {
  UNKNOWN = "Something went wrong. Please try again.",
}

export default function DateOfBirth() {
  const router = useRouter();
  const tokens = getTokens();
  const updateProfile = api.profile.updateProfile.useMutation();
  const [dateOfBirth, setDateOfBirth] = React.useState<Date | undefined>();
  const [error, setError] = React.useState<Error | null>(null);
  const [open, setOpen] = React.useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(
    PLACEHOLDERS[0],
  );

  // Shared values for animations
  const welcomeFloat = useSharedValue(0);
  const inputScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Constant schema validation
  const isValidDateOfBirth =
    sharedValidators.user.dateOfBirth.safeParse(dateOfBirth).success;

  // Start animations
  useEffect(() => {
    // Welcome float animation
    welcomeFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 }),
      ),
      -1,
      true,
    );

    // Rotate placeholders
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % PLACEHOLDERS.length;
      setCurrentPlaceholder(PLACEHOLDERS[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Animated styles
  const welcomeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(welcomeFloat.value, [0, 1], [0, -8]) },
    ],
  }));

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePress = () => {
    inputScale.value = withSpring(0.98, { mass: 0.5, damping: 12 });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  };

  const handleDateConfirm = (date: Date) => {
    setOpen(false);
    setDateOfBirth(date);
    setError(null);
    inputScale.value = withSpring(1.02, { mass: 0.5, damping: 12 });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSubmit = async () => {
    if (!isValidDateOfBirth || !dateOfBirth) return;

    try {
      buttonScale.value = withSequence(
        withSpring(0.95, { mass: 0.5, damping: 10 }),
        withSpring(1.05, { mass: 0.5, damping: 8 }),
        withSpring(1, { mass: 0.5, damping: 5 }),
      );

      await updateProfile.mutateAsync({ dateOfBirth });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/user-info/profile-picture");
    } catch (err) {
      if (isTRPCClientError(err)) {
        switch (err.data?.code) {
          default:
            setError(Error.UNKNOWN);
            break;
        }
      } else {
        setError(Error.UNKNOWN);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      buttonScale.value = withSequence(
        withSpring(0.95, { damping: 15 }),
        withSpring(1, { damping: 12 }),
      );
    }
  };

  return (
    <ScreenView
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
      paddingHorizontal="$6"
      justifyContent="space-between"
    >
      <YStack gap="$6" paddingTop="$12">
        <AnimatedYStack
          gap="$2"
          entering={FadeIn.delay(200)}
          style={welcomeStyle}
        >
          <AnimatedText
            color="rgba(255,255,255,0.7)"
            fontSize="$6"
            textAlign="center"
            fontWeight="600"
            entering={FadeIn.duration(1000)}
          >
            Tell us about yourself
          </AnimatedText>
          <Text
            color="white"
            fontSize="$9"
            lineHeight={40}
            textAlign="center"
            fontWeight="800"
          >
            When's your birthday?
          </Text>
        </AnimatedYStack>

        <YStack gap="$2">
          <TouchableOpacity
            style={{ width: "100%" }}
            activeOpacity={0.8}
            onPress={handlePress}
          >
            <Animated.View style={inputStyle}>
              <AnimatedInput
                value={dateOfBirth?.toLocaleDateString()}
                placeholder={currentPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                borderWidth={0}
                size="$6"
                fontSize={24}
                color="#fff"
                textAlign="center"
                fontWeight="bold"
                padding={16}
                backgroundColor="rgba(255,255,255,0.1)"
                borderRadius={16}
                shadowColor="#fff"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 10 }}
                selectionColor="white"
                editable={false}
                pointerEvents="none"
                entering={FadeIn.delay(400)}
              />
            </Animated.View>
          </TouchableOpacity>
          {error && (
            <Text color="$red11" textAlign="center" fontSize="$5">
              {error}
            </Text>
          )}
        </YStack>
      </YStack>

      <Animated.View style={buttonStyle}>
        <AnimatedXStack entering={FadeIn.delay(600)}>
          <Button
            flex={1}
            backgroundColor={
              isValidDateOfBirth ? "white" : "rgba(255,255,255,0)"
            }
            borderRadius="$10"
            disabled={!isValidDateOfBirth || updateProfile.isPending}
            pressStyle={{
              scale: 0.95,
              opacity: 0.9,
            }}
            animation="quick"
            onPress={handleSubmit}
          >
            {updateProfile.isPending ? (
              <Spinner />
            ) : (
              <XStack gap="$2" alignItems="center" justifyContent="center">
                <Text
                  color={
                    isValidDateOfBirth ? tokens.color.primary.val : "white"
                  }
                  fontSize="$6"
                  fontWeight="600"
                >
                  Continue
                </Text>
                <ChevronRight
                  size={20}
                  color={
                    isValidDateOfBirth ? tokens.color.primary.val : "white"
                  }
                />
              </XStack>
            )}
          </Button>
        </AnimatedXStack>
      </Animated.View>

      <DatePicker
        modal
        mode="date"
        open={open}
        date={dateOfBirth ?? new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setOpen(false)}
      />
    </ScreenView>
  );
}
