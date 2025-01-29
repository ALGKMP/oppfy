import React, { useCallback, useEffect } from "react";
import { TextInput } from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  runOnJS,
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
  ScreenView,
  Spinner,
  Text,
  XStack,
  YStack,
} from "~/components/ui";
import { api, isTRPCClientError } from "~/utils/api";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedXStack = Animated.createAnimatedComponent(XStack);
const AnimatedText = Animated.createAnimatedComponent(Text);

const PLACEHOLDERS = [
  "Enter your name",
  "Type your name",
  "What should we call you?",
  "Your name goes here",
];

enum Error {
  UNKNOWN = "Something went wrong. Please try again.",
}

export default function Name() {
  const router = useRouter();
  const tokens = getTokens();
  const updateProfile = api.profile.updateProfile.useMutation();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<Error | null>(null);
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(
    PLACEHOLDERS[0],
  );

  // Shared values for animations
  const welcomeFloat = useSharedValue(0);
  const inputScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Constant schema validation
  const isValidName = sharedValidators.user.name.safeParse(name).success;

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
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Optimized text handling
  const handleTextChange = (text: string) => {
    setName(text);
    setError(null);

    // Scale animations based on text length changes
    if (text.length === 0 && name.length > 0) {
      inputScale.value = withSpring(0.98, { mass: 0.5, damping: 12 });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (text.length === 1 && name.length === 0) {
      inputScale.value = withSpring(1.02, { mass: 0.5, damping: 12 });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      inputScale.value = withSpring(1, { mass: 0.5, damping: 12 });
    }
  };

  const handleSubmit = async () => {
    if (!isValidName) return;

    try {
      buttonScale.value = withSequence(
        withSpring(0.95, { mass: 0.5, damping: 10 }),
        withSpring(1.05, { mass: 0.5, damping: 8 }),
        withSpring(1, { mass: 0.5, damping: 5 }),
      );

      await updateProfile.mutateAsync({ name });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/user-info/username");
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
      <YStack gap="$8" paddingTop="$8">
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
            Welcome to Oppfy
          </AnimatedText>
          <Text
            color="white"
            fontSize="$9"
            lineHeight={40}
            textAlign="center"
            fontWeight="800"
          >
            What's your name?
          </Text>
        </AnimatedYStack>

        <YStack gap="$2">
          <Animated.View style={inputStyle}>
            <AnimatedTextInput
              value={name}
              onChangeText={handleTextChange}
              entering={FadeIn.delay(400)}
              placeholder={currentPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={{
                fontSize: 24,
                color: "#fff",
                textAlign: "center",
                fontWeight: "500",
                padding: 16,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                shadowColor: "#fff",
                shadowOpacity: 0.1,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
              }}
              autoFocus
              autoCorrect={false}
              maxLength={50}
            />
          </Animated.View>
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
            backgroundColor={isValidName ? "white" : "rgba(255,255,255,0)"}
            borderRadius="$10"
            disabled={!isValidName || updateProfile.isPending}
            pressStyle={{
              scale: 0.95,
              opacity: 0.9,
              backgroundColor: "white",
            }}
            animation="medium"
            onPress={handleSubmit}
          >
            {updateProfile.isPending ? (
              <Spinner />
            ) : (
              <XStack gap="$2" alignItems="center" justifyContent="center">
                <Text
                  color={isValidName ? tokens.color.primary.val : "white"}
                  fontSize="$6"
                  fontWeight="600"
                >
                  Continue
                </Text>
                <ChevronRight
                  size={20}
                  color={isValidName ? tokens.color.primary.val : "white"}
                />
              </XStack>
            )}
          </Button>
        </AnimatedXStack>
      </Animated.View>
    </ScreenView>
  );
}
