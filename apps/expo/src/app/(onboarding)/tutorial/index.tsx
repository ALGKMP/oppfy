import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SplashScreen, useRouter } from "expo-router";
import Splash from "@assets/icons/logo.png";
// Import collage images
import Opp4 from "@assets/onboarding/opp-4.jpg";
import Opp7 from "@assets/onboarding/opp-7.jpg";
import Pop1 from "@assets/onboarding/pop-1.jpg";
import Pop2 from "@assets/onboarding/pop-2.jpg";
import Pop8 from "@assets/onboarding/pop-8.jpg";
import { getToken } from "tamagui";

import { H2, ScreenView, Text, View } from "~/components/ui";
import { OnboardingButton } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";

// =================== MAIN SCREEN ===================
const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function Start() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  // Main logo reanimated
  const scale = useSharedValue(0); // Start at 0 to be hidden initially
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const glowOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0); // Control logo visibility

  // Collage image animations
  const pop1Anim = useSharedValue(0);
  const pop8Anim = useSharedValue(0);
  const opp7Anim = useSharedValue(0);
  const collageOpacity = useSharedValue(0);

  // =================== IMAGE COLLAGE ANIMATION ===================
  useEffect(() => {
    const animateCollage = async () => {
      // Hide splash screen
      await new Promise((resolve) => setTimeout(resolve, 300));
      await SplashScreen.hideAsync();

      // Fade in collage background
      collageOpacity.value = withTiming(1, { duration: 500 });

      // Animate images in sequence with delays
      setTimeout(() => {
        // Pop1 animation
        pop1Anim.value = withTiming(1, { duration: 400 });

        // Pop8 animation after delay
        setTimeout(() => {
          pop8Anim.value = withTiming(1, { duration: 400 });

          // Opp7 animation after delay
          setTimeout(() => {
            opp7Anim.value = withTiming(1, { duration: 400 });

            // Add haptic feedback after image animations complete
            setTimeout(() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // After all images have appeared, start the logo animation
              animateLogo();
            }, 800);
          }, 400);
        }, 400);
      }, 500);
    };

    // Start the collage animations immediately
    void animateCollage();
  }, []);

  // =================== LOGO ANIMATION ===================
  const animateLogo = () => {
    // Fade in logo
    logoOpacity.value = withTiming(1, { duration: 400 });

    // Big scale entrance
    scale.value = withSequence(
      withTiming(0.8, { duration: 200 }),
      withSpring(1.2, { damping: 12, stiffness: 100 }),
      withSpring(1, { damping: 10 }),
    );

    // Wiggle rotate
    rotate.value = withSequence(
      withTiming(12, { duration: 200 }),
      withTiming(-12, { duration: 200 }),
      withTiming(0, { duration: 200 }),
    );

    // Bounce
    translateY.value = withSequence(
      withTiming(-50, { duration: 300 }),
      withSpring(0, { damping: 8, stiffness: 100 }),
    );

    // Glow effect
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.4, { duration: 500 }),
      withTiming(1, { duration: 500 }),
      withTiming(0.7, { duration: 500 }), // final
    );

    // Button with delay
    setTimeout(() => {
      buttonOpacity.value = withSpring(1, { damping: 12, stiffness: 80 });
      buttonTranslateY.value = withSpring(0, { damping: 12, stiffness: 80 });

      // Final haptic feedback when everything is done
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 1200);
  };

  // =================== HANDLER ===================
  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/tutorial/screen1");
  };

  // =================== ANIMATED STYLES ===================
  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // Animated collage styles
  const animatedCollageStyle = useAnimatedStyle(() => ({
    opacity: collageOpacity.value,
  }));

  const animatedPop1Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: "-5deg" },
      {
        translateY: interpolate(pop1Anim.value, [0, 1], [50, 0]),
      },
    ],
    opacity: pop1Anim.value,
  }));

  const animatedPop8Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: "6deg" },
      {
        translateY: interpolate(pop8Anim.value, [0, 1], [50, 0]),
      },
    ],
    opacity: pop8Anim.value,
  }));

  const animatedOpp7Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: "-6deg" },
      {
        translateY: interpolate(opp7Anim.value, [0, 1], [50, 0]),
      },
    ],
    opacity: opp7Anim.value,
  }));

  // =================== RENDER ===================
  return (
    <ScreenView
      padding={0}
      backgroundColor="$primary"
      safeAreaEdges={["bottom"]}
    >
      {/* Image Collage (appears first) */}
      <Animated.View style={[styles.collageContainer, animatedCollageStyle]}>
        {/* Fixed position image */}
        <Image
          source={Pop2}
          style={{
            position: "absolute",
            left: 150,
            top: 50,
            width: 300,
            height: 500,
            borderRadius: 20,
            borderWidth: 5,
            borderColor: "white",
            transform: [{ rotate: "6deg" }],
            zIndex: 1,
          }}
        />

        {/* Animated Pop1 */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 20,
              top: 100,
              width: 300,
              height: 500,
              borderRadius: 20,
              borderWidth: 5,
              borderColor: "white",
              zIndex: 2,
              overflow: "hidden",
            },
            animatedPop1Style,
          ]}
        >
          <Image source={Pop1} style={{ width: "100%", height: "100%" }} />
        </Animated.View>

        {/* Animated Pop8 */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 150,
              left: 100,
              width: 300,
              height: 600,
              borderRadius: 20,
              borderWidth: 5,
              borderColor: "white",
              zIndex: 3,
              overflow: "hidden",
            },
            animatedPop8Style,
          ]}
        >
          <Image source={Pop8} style={{ width: "100%", height: "100%" }} />
        </Animated.View>

        {/* Animated Opp7 */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 250,
              left: 25,
              width: 350,
              height: 550,
              borderRadius: 20,
              borderWidth: 5,
              borderColor: "white",
              zIndex: 4,
              overflow: "hidden",
            },
            animatedOpp7Style,
          ]}
        >
          <Image source={Opp7} style={{ width: "100%", height: "100%" }} />
        </Animated.View>

        {/* Gradient Overlay and Text */}
        <View
          position="absolute"
          bottom={0}
          width="100%"
          height="100%"
          justifyContent="flex-end"
          style={{ zIndex: 5 }}
        >
          <LinearGradient
            colors={["transparent", "#F214FF"]}
            locations={[0.6, 1.0]}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            {/* <View paddingBottom={40} alignItems="center">
              <Text
                fontSize={32}
                fontWeight="bold"
                color="white"
                textAlign="center"
                marginBottom={40}
              >
                post for your friends
              </Text>
            </View> */}
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Main Logo & UI (appears after images) */}
      <View
        position="absolute"
        width="100%"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        {/* Glow behind logo */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 9999,
              transform: [{ scale: 1.2 }],
            },
            animatedGlowStyle,
          ]}
        />

        <AnimatedImage
          source={Splash}
          contentFit="contain"
          style={[
            {
              width: "86%",
              aspectRatio: 4,
              resizeMode: "contain",
            },
            animatedIconStyle,
          ]}
        />
      </View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: getToken("$4", "space") as number,
            paddingHorizontal: getToken("$6", "space") as number,
          },
          animatedButtonStyle,
        ]}
      >
        <OnboardingButton onPress={onSubmit} isValid text="next" />
      </Animated.View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  collageContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
});
