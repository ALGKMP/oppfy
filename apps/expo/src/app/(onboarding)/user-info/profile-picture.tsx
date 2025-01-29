import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
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
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Camera, ChevronRight } from "@tamagui/lucide-icons";
import { getTokens } from "tamagui";

import {
  Button,
  ScreenView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useUploadProfilePicture } from "~/hooks/media";
import { api, isTRPCClientError } from "~/utils/api";

const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedXStack = Animated.createAnimatedComponent(XStack);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

enum Error {
  UNKNOWN = "Something went wrong. Please try again.",
}

export default function ProfilePicture() {
  const router = useRouter();
  const tokens = getTokens();
  const completedOnboarding = api.user.completedOnboarding.useMutation();
  const [error, setError] = React.useState<Error | null>(null);

  const {
    selectedImageUri,
    pickImage,
    uploadImage,
    isPickerLoading,
    isUploading,
  } = useUploadProfilePicture();

  // Shared values for animations
  const welcomeFloat = useSharedValue(0);
  const imageScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const imageRotate = useSharedValue(0);

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

    // Initial image animation - elegant fade in with subtle scale
    imageScale.value = withTiming(0, { duration: 0 });
    imageRotate.value = withTiming(0, { duration: 0 });

    setTimeout(() => {
      imageScale.value = withSpring(1, {
        mass: 1,
        damping: 15,
        stiffness: 100,
      });
    }, 400);
  }, []);

  // Animated styles
  const welcomeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(welcomeFloat.value, [0, 1], [0, -8]) },
    ],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
    opacity: interpolate(imageScale.value, [0, 1], [0, 1]),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleImagePick = async () => {
    imageScale.value = withSpring(0.95, { mass: 0.5, damping: 12 });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await pickImage();
      imageScale.value = withSequence(
        withSpring(1.1, { mass: 0.5, damping: 8 }),
        withSpring(1, { mass: 0.5, damping: 10 }),
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      imageScale.value = withSpring(1, { mass: 0.5, damping: 12 });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(Error.UNKNOWN);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImageUri) {
      // Skip flow
      try {
        buttonScale.value = withSequence(
          withSpring(0.95, { mass: 0.5, damping: 10 }),
          withSpring(1.05, { mass: 0.5, damping: 8 }),
          withSpring(1, { mass: 0.5, damping: 5 }),
        );

        await completedOnboarding.mutateAsync();
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        router.replace("/tutorial/intro");
      } catch (err) {
        setError(Error.UNKNOWN);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        buttonScale.value = withSequence(
          withSpring(0.95, { damping: 15 }),
          withSpring(1, { damping: 12 }),
        );
      }
      return;
    }

    // Upload flow
    try {
      buttonScale.value = withSequence(
        withSpring(0.95, { mass: 0.5, damping: 10 }),
        withSpring(1.05, { mass: 0.5, damping: 8 }),
        withSpring(1, { mass: 0.5, damping: 5 }),
      );

      await uploadImage(selectedImageUri);
      await completedOnboarding.mutateAsync();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/tutorial/intro");
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
            One last thing
          </AnimatedText>
          <Text
            color="white"
            fontSize="$9"
            lineHeight={40}
            textAlign="center"
            fontWeight="800"
          >
            Show us a{"\n"}beautiful face
          </Text>
        </AnimatedYStack>

        <YStack gap="$4" alignItems="center">
          <TouchableOpacity
            style={{ width: "100%" }}
            activeOpacity={0.8}
            onPress={handleImagePick}
          >
            <Animated.View style={imageStyle}>
              <AnimatedView
                position="relative"
                alignItems="center"
                entering={FadeIn.delay(400)}
              >
                <View>
                  <AnimatedImage
                    source={selectedImageUri ?? DefaultProfilePicture}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                      borderColor: "white",
                      borderWidth: 3,
                      shadowColor: "white",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                    }}
                    contentFit="cover"
                  />
                  <View
                    position="absolute"
                    right={0}
                    bottom={0}
                    backgroundColor="white"
                    backdropFilter="blur(12px)"
                    borderRadius={32}
                    padding="$3"
                    borderWidth={2}
                    borderColor={tokens.color.primary.val}
                  >
                    <Camera size={24} color={tokens.color.primary.val} />
                  </View>
                </View>
              </AnimatedView>
            </Animated.View>
          </TouchableOpacity>
          {error ? (
            <Text color="$red11" textAlign="center" fontSize="$5">
              {error}
            </Text>
          ) : (
            selectedImageUri && (
              <AnimatedText
                textAlign="center"
                fontSize="$5"
                entering={FadeIn.duration(800).delay(200)}
              >
                Looking good! You're ready to go.
              </AnimatedText>
            )
          )}
        </YStack>
      </YStack>

      <Animated.View style={buttonStyle}>
        <AnimatedXStack entering={FadeIn.delay(600)}>
          <Button
            flex={1}
            backgroundColor={selectedImageUri ? "white" : "rgba(255,255,255,0)"}
            borderRadius="$10"
            disabled={isPickerLoading || isUploading}
            opacity={selectedImageUri ? 1 : 0.7}
            pressStyle={{
              scale: 0.95,
              opacity: 0.9,
              backgroundColor: selectedImageUri
                ? "white"
                : "rgba(255,255,255,0)",
            }}
            animation="medium"
            onPress={handleSubmit}
          >
            {isUploading ? (
              <Spinner />
            ) : (
              <XStack gap="$2" alignItems="center" justifyContent="center">
                <Text
                  color={selectedImageUri ? tokens.color.primary.val : "white"}
                  fontSize="$6"
                  fontWeight="600"
                >
                  {selectedImageUri ? "Continue" : "Skip for now"}
                </Text>
                <ChevronRight
                  size={20}
                  color={selectedImageUri ? tokens.color.primary.val : "white"}
                />
              </XStack>
            )}
          </Button>
        </AnimatedXStack>
      </Animated.View>
    </ScreenView>
  );
}
