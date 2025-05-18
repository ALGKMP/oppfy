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
import { OnboardingButton } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";

// Define interfaces
interface OnboardingImage {
  id: string;
  photo: any;
  username: string;
  caption: string;
}

// Import all onboarding images
const onboardingImages: OnboardingImage[] = [
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
  //   {
  // id: "7",
  // photo: require("../../../../assets/onboarding/opp-7.JPG"),
  // username: "taylor",
  // caption: "Weekend escape 🚗",
  //   },
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
    const scrollDuration = 2000; // 3 seconds total animation time (reduced from 20000)
    animationStartTime.current = Date.now();

    const animate = () => {
      if (!scrollViewRef.current || !animationStartTime.current) return;

      const now = Date.now();
      const elapsedTime = now - animationStartTime.current;
      const progress = Math.min(elapsedTime / scrollDuration, 1);

      // Create an easing curve that starts slow and accelerates
      // Using a custom power function for stronger acceleration
      const easedProgress = Math.pow(progress, 2.2); // Reduced power for faster initial speed

      // Calculate current scroll position
      const scrollPos = easedProgress * (totalScrollHeight.current - 300);

      // Scroll to position without animation to prevent jank
      scrollViewRef.current.scrollTo({
        y: scrollPos,
        animated: false,
      });

      // Determine if we're near the end for the footer animation
      if (progress > 0.75 && !isNearEnd) {
        // Show footer sooner
        setIsNearEnd(true);
        opacity.value = withTiming(1, { duration: 400 });
      }

      // Continue animation if not complete
      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(animate);
  };

  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (requiredPermissions) {
      router.push("/auth/phone-number");
    } else {
      router.push("/misc/permissions");
    }
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
                height: 160,
                zIndex: 1,
              }}
            />

            {/* Top Header */}
            <XStack
              position="absolute"
              top={0}
              left={0}
              right={0}
              paddingVertical="$4"
              paddingHorizontal="$4"
              justifyContent="space-between"
              zIndex={2}
            >
              <XStack gap="$3" alignItems="center">
                <View
                  width={44}
                  height={44}
                  borderRadius={22}
                  backgroundColor="white"
                  borderWidth={2}
                  borderColor="white"
                  overflow="hidden"
                >
                  {/* Profile pic placeholder */}
                </View>

                <YStack>
                  <Text
                    color="white"
                    fontWeight="600"
                    fontSize="$5"
                    shadowColor="black"
                    shadowOffset={{ width: 1, height: 1 }}
                    shadowOpacity={0.4}
                    shadowRadius={3}
                  >
                    {item.username}
                  </Text>
                  <XStack gap="$1" alignItems="center">
                    <Text
                      color="white"
                      fontWeight="500"
                      fontSize="$4"
                      shadowColor="black"
                      shadowOffset={{ width: 1, height: 1 }}
                      shadowOpacity={0.4}
                      shadowRadius={3}
                    >
                      opped by friend
                    </Text>
                    <Text
                      color="white"
                      fontWeight="500"
                      fontSize="$4"
                      shadowColor="black"
                      shadowOffset={{ width: 1, height: 1 }}
                      shadowOpacity={0.4}
                      shadowRadius={3}
                    >
                      • just now
                    </Text>
                  </XStack>
                </YStack>
              </XStack>
            </XStack>

            {/* Bottom Content Overlay */}
            <YStack
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              paddingHorizontal="$4"
              paddingVertical="$4"
              zIndex={2}
              gap="$2"
            >
              <View maxWidth="80%">
                <Text
                  color="white"
                  fontSize="$4"
                  fontWeight="500"
                  shadowColor="black"
                  shadowOffset={{ width: 1, height: 1 }}
                  shadowOpacity={0.4}
                  shadowRadius={3}
                >
                  {item.caption}
                </Text>
              </View>
            </YStack>
          </View>
        </View>
      </Animated.View>
    ));
  };

  return (
    <ScreenView
      padding={0}
      safeAreaEdges={["bottom", "top"]}
      backgroundColor="#C7F458"
    >
      <YStack flex={1} width="100%">
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 160,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          onContentSizeChange={onContentSizeChange}
        >
          {renderImageItems()}
        </ScrollView>

        {/* Absolutely positioned bottom content with gradient */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              width: "100%",
              pointerEvents: isNearEnd ? "auto" : "none",
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={["transparent", "#C7F458"]}
            locations={[0.0, 1.0]}
            style={{ width: "100%" }}
          >
            <View
              style={{
                width: "100%",
                paddingBottom: 40,
                alignItems: "center",
                paddingTop: 80,
              }}
            >
              <Text
                fontSize={32}
                fontWeight="bold"
                color="white"
                textAlign="center"
                marginBottom={20}
              >
                embarrass them
              </Text>
              <View width="100%" paddingHorizontal={24}>
                <OnboardingButton onPress={onSubmit} isValid text="next" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </YStack>
    </ScreenView>
  );
}
