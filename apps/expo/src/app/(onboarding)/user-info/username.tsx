import React, { useEffect } from "react";
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
const AnimatedOnboardingInput = Animated.createAnimatedComponent(Input);

const PLACEHOLDERS = [
  "Enter a username",
  "Pick your username",
  "Choose your handle",
  "Create your username",
];

enum Error {
  USERNAME_TAKEN = "Username is already taken.",
  UNKNOWN = "Something went wrong. Please try again.",
}

export default function Username() {
  const router = useRouter();
  const tokens = getTokens();
  const updateProfile = api.profile.updateProfile.useMutation();
  const [username, setUsername] = React.useState("");
  const [error, setError] = React.useState<Error | null>(null);
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(
    PLACEHOLDERS[0],
  );

  // Shared values for animations
  const welcomeFloat = useSharedValue(0);
  const inputScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Constant schema validation
  const isValidUsername = sharedValidators.user.username.safeParse(
    username.toLowerCase(),
  ).success;

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

  const handleUsernameChange = (text: string) => {
    const formattedText = text.replace(/\s/g, "_");
    setUsername(formattedText);
    setError(null);

    // Scale animations based on text length changes
    if (formattedText.length === 0 && username.length > 0) {
      inputScale.value = withSpring(0.98, { mass: 0.5, damping: 12 });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (formattedText.length === 1 && username.length === 0) {
      inputScale.value = withSpring(1.02, { mass: 0.5, damping: 12 });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      inputScale.value = withSpring(1, { mass: 0.5, damping: 12 });
    }
  };

  const handleSubmit = async () => {
    if (!isValidUsername) return;

    try {
      buttonScale.value = withSequence(
        withSpring(0.95, { mass: 0.5, damping: 10 }),
        withSpring(1.05, { mass: 0.5, damping: 8 }),
        withSpring(1, { mass: 0.5, damping: 5 }),
      );

      await updateProfile.mutateAsync({ username: username.toLowerCase() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/user-info/date-of-birth");
    } catch (err) {
      if (isTRPCClientError(err)) {
        switch (err.data?.code) {
          case "CONFLICT":
            setError(Error.USERNAME_TAKEN);
            break;
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
            Create your identity
          </AnimatedText>
          <Text
            color="white"
            fontSize="$9"
            lineHeight={40}
            textAlign="center"
            fontWeight="800"
          >
            Choose a username!
          </Text>
        </AnimatedYStack>

        <YStack gap="$2">
          <Animated.View style={inputStyle}>
            <AnimatedOnboardingInput
              value={username}
              onChangeText={handleUsernameChange}
              entering={FadeIn.delay(400)}
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
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
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
            backgroundColor={isValidUsername ? "white" : "rgba(255,255,255,0)"}
            borderRadius="$10"
            disabled={!isValidUsername || updateProfile.isPending}
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
                  color={isValidUsername ? tokens.color.primary.val : "white"}
                  fontSize="$6"
                  fontWeight="600"
                >
                  Continue
                </Text>
                <ChevronRight
                  size={20}
                  color={isValidUsername ? tokens.color.primary.val : "white"}
                />
              </XStack>
            )}
          </Button>
        </AnimatedXStack>
      </Animated.View>
    </ScreenView>
  );
}
