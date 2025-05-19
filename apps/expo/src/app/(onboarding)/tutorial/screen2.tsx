import React, { useEffect, useRef, useState } from "react";
import { Image, ScrollView } from "react-native";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, View, XStack, YStack } from "tamagui";

import { ScreenView } from "~/components/ui";
import { usePermissions } from "~/contexts/PermissionsContext";

// Define interfaces
interface OnboardingImage {
  id: string;
  photo: any;
  username: string;
  caption: string;
}

// Import all onboarding images
const baseImages: OnboardingImage[] = [
  {
    id: "1",
    photo: require("../../../../assets/onboarding/opp-1.jpg"),
    username: "emma",
    caption: "Sunset vibes with the squad 🌅",
  },
  {
    id: "2",
    photo: require("../../../../assets/onboarding/opp-2.jpg"),
    username: "jake",
    caption: "Coffee adventures ☕️",
  },
  {
    id: "3",
    photo: require("../../../../assets/onboarding/opp-3.jpg"),
    username: "sophie",
    caption: "Beach day! 🏖️",
  },
  {
    id: "4",
    photo: require("../../../../assets/onboarding/opp-4.jpg"),
    username: "mike",
    caption: "City lights 🌃",
  },
  {
    id: "5",
    photo: require("../../../../assets/onboarding/opp-5.jpg"),
    username: "olivia",
    caption: "Study buddies 📚",
  },
  {
    id: "6",
    photo: require("../../../../assets/onboarding/opp-6.jpg"),
    username: "alex",
    caption: "Concert nights 🎵",
  },
];

// Create a longer array by duplicating the images multiple times with unique IDs
const onboardingImages: OnboardingImage[] = [
  ...baseImages,
  ...baseImages.map((img) => ({ ...img, id: `${img.id}-2` })),
  ...baseImages.map((img) => ({ ...img, id: `${img.id}-3` })),
  ...baseImages.map((img) => ({ ...img, id: `${img.id}-4` })),
];

export default function Start() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;
  const scrollViewRef = useRef<ScrollView>(null);

  // Track if we're at the bottom of the scroll
  const [isNearEnd, setIsNearEnd] = useState(false);
  const opacity = useSharedValue(0);
  const totalScrollHeight = useRef(0);
  const animationStartTime = useRef<number | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Get the content height after render
  const onContentSizeChange = (_width: number, height: number) => {
    totalScrollHeight.current = height;
  };

  // Auto-scroll functionality with acceleration
  useEffect(() => {
    // Wait a short delay before starting animation
    const startDelay = setTimeout(() => {
      startScrollAnimation();
    }, 1000);

    return () => {
      clearTimeout(startDelay);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const startScrollAnimation = () => {
    const totalDuration = 7000; // Total animation duration
    const accelerationPhase = 0.3; // First 30% of animation is acceleration
    animationStartTime.current = Date.now();
    let lastScrollPos = 0;

    const animate = () => {
      if (!scrollViewRef.current || !animationStartTime.current) return;

      const now = Date.now();
      const elapsedTime = now - animationStartTime.current;

      // Simple progress from 0 to 1
      const progress = Math.min(elapsedTime / totalDuration, 1);

      // Get max scroll height (80% of total to avoid scrolling too far)
      const maxScrollPos = (totalScrollHeight.current - 300) * 0.8;

      let targetScrollPos;

      // Split the animation into acceleration and deceleration phases
      if (progress < accelerationPhase) {
        // Acceleration phase: ease-in cubic - starts slow, gets faster
        // Map progress from 0-0.3 to 0-0.4 (first 40% of the scroll)
        const accelerationProgress = progress / accelerationPhase;
        const easeInCubic = Math.pow(accelerationProgress, 3);
        targetScrollPos = maxScrollPos * 0.4 * easeInCubic;
      } else {
        // Deceleration phase: ease-out cubic - starts fast, slows down
        // Map progress from 0.3-1.0 to 0.4-1.0 (remaining 60% of the scroll)
        const decelerationProgress =
          (progress - accelerationPhase) / (1 - accelerationPhase);
        const easeOutCubic = 1 - Math.pow(1 - decelerationProgress, 3);
        // Start from 40% scroll position and go to 100%
        targetScrollPos =
          maxScrollPos * 0.4 + maxScrollPos * 0.6 * easeOutCubic;
      }

      // Apply smoothing to prevent jerky movement
      const smoothingFactor = 0.1; // Lower = smoother but slower to respond
      const smoothedPos =
        lastScrollPos +
        (targetScrollPos - lastScrollPos) * (1 - smoothingFactor);
      lastScrollPos = smoothedPos;

      // Show footer when we get past halfway
      if (progress > 0.5 && !isNearEnd) {
        setIsNearEnd(true);
        opacity.value = withTiming(1, { duration: 400 });
      }

      // Add subtle haptic feedback during phase transitions and deceleration
      if (
        (progress > accelerationPhase - 0.03 &&
          progress < accelerationPhase + 0.03) || // During phase transition
        (progress > 0.5 && progress < 0.9) // During deceleration
      ) {
        // Only trigger haptics occasionally
        if (
          Math.floor(progress * 20) !==
          Math.floor(((elapsedTime - 16) / totalDuration) * 20)
        ) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      // Apply the scroll position
      scrollViewRef.current.scrollTo({
        y: smoothedPos,
        animated: false, // NEVER use true here
      });

      // Continue until complete
      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, wait a bit then route
        setTimeout(() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          if (requiredPermissions) {
            router.push("/auth/phone-number");
          } else {
            router.push("/misc/permissions");
          }
        }, 1000);
      }
    };

    // Start the animation
    animationFrameId.current = requestAnimationFrame(animate);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: (1 - opacity.value) * 50 }],
    };
  });

  // Render all image items
  const renderImageItems = () => {
    return onboardingImages.map((item, index) => (
      <Animated.View
        key={item.id}
        entering={FadeIn.delay(index * 100).duration(400)}
        layout={LinearTransition.springify()}
      >
        <View
          borderRadius="$8"
          borderWidth="$1.5"
          borderColor="white"
          overflow="hidden"
          marginBottom={20}
        >
          <View>
            <Image
              source={item.photo}
              style={{
                width: "100%",
                height: 550,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />

            {/* Top Gradient Overlay */}
            <LinearGradient
              colors={["rgba(0,0,0,0.5)", "transparent"]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 120,
                zIndex: 1,
              }}
            />

            {/* Bottom Gradient Overlay */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 120,
                zIndex: 1,
              }}
            />

            {/* Username and Caption */}
            <View
              position="absolute"
              bottom={16}
              left={16}
              right={16}
              zIndex={2}
            >
              <Text
                color="white"
                fontSize={18}
                fontWeight="bold"
                marginBottom={4}
              >
                {item.username}
              </Text>
              <Text color="white" fontSize={16}>
                {item.caption}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    ));
  };

  return (
    <ScreenView padding={0} safeAreaEdges={["bottom"]}>
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={onContentSizeChange}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <YStack padding={16}>{renderImageItems()}</YStack>
      </ScrollView>
    </ScreenView>
  );
}
