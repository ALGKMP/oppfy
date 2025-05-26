import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SplashScreen, useRouter } from "expo-router";
import Splash from "@assets/icons/logo.png";
// Import collage images
import Opp7 from "@assets/onboarding/opp-7.jpg";
import Pop1 from "@assets/onboarding/pop-1.jpg";
import Pop2 from "@assets/onboarding/pop-2.jpg";
import Pop8 from "@assets/onboarding/pop-8.jpg";

import { ScreenView, View } from "~/components/ui";
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
  const glowOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0); // Control logo visibility

  // Collage image animations
  const pop1Anim = useSharedValue(0);
  const pop8Anim = useSharedValue(0);
  const opp7Anim = useSharedValue(0);
  const collageOpacity = useSharedValue(0);

  // Helper functions for haptic feedback
  const triggerImpactHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    void Haptics.impactAsync(style);
  };

  const triggerNotificationHaptic = (
    type: Haptics.NotificationFeedbackType,
  ) => {
    void Haptics.notificationAsync(type);
  };

  // =================== IMAGE COLLAGE ANIMATION ===================
  useEffect(() => {
    const animateCollage = async () => {
      // Hide splash screen with a subtle haptic kickoff
      await new Promise((resolve) => setTimeout(resolve, 300));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await SplashScreen.hideAsync();

      // Fade in collage background with a gentle vibration
      collageOpacity.value = withTiming(1, { duration: 500 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Soft);
      });

      // Animate images in sequence with creative haptics
      setTimeout(() => {
        // Pop1 animation with a light, quick pulse
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Light);
        pop1Anim.value = withTiming(1, { duration: 400 });

        // Pop8 animation with a medium double-tap effect
        setTimeout(() => {
          runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Medium);
          setTimeout(
            () =>
              runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Soft),
            100,
          );
          pop8Anim.value = withTiming(1, { duration: 400 });

          // Opp7 animation with a heavy thud
          setTimeout(() => {
            runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Heavy);
            opp7Anim.value = withTiming(1, { duration: 400 });

            // After all images, trigger logo animation with a success vibe
            setTimeout(() => {
              runOnJS(triggerNotificationHaptic)(
                Haptics.NotificationFeedbackType.Success,
              );
              animateLogo();
            }, 800);
          }, 400);
        }, 400);
      }, 500);
    };

    // Start the collage animations immediately
    void animateCollage();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =================== LOGO ANIMATION ===================
  const animateLogo = () => {
    // Fade in logo with a soft entry haptic
    logoOpacity.value = withTiming(1, { duration: 400 }, () => {
      runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Soft);
    });

    // Big scale entrance with escalating haptics
    scale.value = withSequence(
      withTiming(0.8, { duration: 200 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Light);
      }),
      withSpring(1.2, { damping: 12, stiffness: 100 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Medium);
      }),
      withSpring(1, { damping: 10 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Heavy);
      }),
    );

    // Wiggle rotate with rhythmic haptics
    rotate.value = withSequence(
      withTiming(12, { duration: 200 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Medium);
      }),
      withTiming(-12, { duration: 200 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Medium);
      }),
      withTiming(0, { duration: 200 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Medium);
      }),
    );

    // Bounce with dramatic haptics
    translateY.value = withSequence(
      withTiming(-50, { duration: 300 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Heavy);
      }),
      withSpring(0, { damping: 8, stiffness: 100 }, () => {
        runOnJS(triggerNotificationHaptic)(
          Haptics.NotificationFeedbackType.Success,
        );
      }),
    );

    // Glow effect with subtle pulsing haptics
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 500 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Soft);
      }),
      withTiming(0.4, { duration: 500 }),
      withTiming(1, { duration: 500 }, () => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Soft);
      }),
      withTiming(0.7, { duration: 500 }),
    );

    // Final epic haptic sequence before navigation
    setTimeout(() => {
      // Crescendo effect: light -> medium -> heavy -> success
      runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
          runOnJS(triggerImpactHaptic)(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(() => {
            runOnJS(triggerNotificationHaptic)(
              Haptics.NotificationFeedbackType.Success,
            );
            // Navigate to next screen
            if (requiredPermissions) {
              router.replace("/auth/phone-number");
            } else {
              router.replace("/auth/permissions");
            }
          }, 150);
        }, 150);
      }, 150);
    }, 2000); // Wait for logo animations to finish
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

        {/* Gradient Overlay */}
        <View
          position="absolute"
          bottom={0}
          width="100%"
          height="100%"
          justifyContent="flex-end"
          style={{ zIndex: 5 }}
        />
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
