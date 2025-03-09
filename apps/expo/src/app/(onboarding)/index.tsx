import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Dimensions } from "react-native";
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
import { SplashScreen, useRouter } from "expo-router";
import Splash from "@assets/icons/logo.png";
import { getToken } from "tamagui";

import { H2, ScreenView, View } from "~/components/ui";
import { OnboardingButton } from "~/components/ui/Onboarding";
import { usePermissions } from "~/contexts/PermissionsContext";

// ====================== CONFIG ======================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Fixed-size pool for performance
const MAX_EMOJI_POOL = 50;
const SPAWN_INTERVAL_MS = 100;

const CONFIG = {
  EMOJI_SIZE: 40,
  // Fall durations let you see the arc
  FALL_DURATION_MIN: 1500,
  FALL_DURATION_MAX: 2000,

  // We'll do a single half-cosine in X
  // amplitude picks a random sign for left or right
  ARC_AMPLITUDE_MIN: 40,
  ARC_AMPLITUDE_MAX: 120,

  // We'll rotate up to ±20° across the fall
  MAX_ROTATION_DEG: 20,

  PHASES: [
    { key: "FIRE", emoji: "🔥", duration: 1200 },
    { key: "SKULL", emoji: "💀", duration: 1200 },
    { key: "LAUGH", emoji: "😈", duration: 1200 },
    { key: "CAMERA", emoji: "📸", duration: 3000 },
  ],
};

// ================== FLOATING EMOJI (POOL ITEM) ==================
export interface FloatingEmojiRef {
  resetAndAnimate: (emoji: string) => void;
}

interface FloatingEmojiProps {
  size: number;
}

/**
 * A single re-usable emoji that arcs from top to bottom.
 */
const FloatingEmoji = forwardRef<FloatingEmojiRef, FloatingEmojiProps>(
  ({ size }, ref) => {
    // We store the actual character in normal React state
    const [emoji, setEmoji] = useState("🔥");

    // Reanimated shared values
    const progress = useSharedValue(0); // 0→1 over the fall
    const startX = useSharedValue(0); // random initial x
    const arcAmp = useSharedValue(0); // amplitude for arc
    const scale = useSharedValue(0);

    // Called by the parent to spawn a new fall
    useImperativeHandle(ref, () => ({
      resetAndAnimate(newEmoji: string) {
        setEmoji(newEmoji);

        progress.value = 0;

        // random initial X
        const x = Math.random() * SCREEN_WIDTH;
        startX.value = x;

        // random arc amplitude ±
        const ampBase =
          CONFIG.ARC_AMPLITUDE_MIN +
          Math.random() * (CONFIG.ARC_AMPLITUDE_MAX - CONFIG.ARC_AMPLITUDE_MIN);
        // 50% chance left or right
        arcAmp.value = Math.random() < 0.5 ? -ampBase : ampBase;

        // random fall time
        const duration =
          CONFIG.FALL_DURATION_MIN +
          Math.random() * (CONFIG.FALL_DURATION_MAX - CONFIG.FALL_DURATION_MIN);

        // animate progress 0→1
        progress.value = withTiming(1, {
          duration,
          easing: Easing.out(Easing.quad),
        });

        // pop-in scale
        scale.value = 0;
        scale.value = withSequence(
          withSpring(1.05, { damping: 9 }),
          withSpring(1, { damping: 8 }),
        );
      },
    }));

    // Animate x/y from progress
    const animatedStyle = useAnimatedStyle(() => {
      // y: linear from well above top to well below bottom
      const y = interpolate(
        progress.value,
        [0, 1],
        [-size - 200, SCREEN_HEIGHT + size * 2],
      );

      // x: single half-cosine arc from 0 to 2 * amplitude
      // x(t) = startX + arcAmp * (1 - cos(pi * t))
      //  - at t=0 => x(0) = startX
      //  - at t=1 => x(1) = startX + 2 * arcAmp
      const arcFactor = 1 - Math.cos(Math.PI * progress.value);
      const x = startX.value + arcAmp.value * arcFactor;

      // rotation: from 0 to ±MAX_ROTATION_DEG across progress
      // sign determined by arcAmp. So if we arc right, we rotate right.
      const rotationSign = arcAmp.value > 0 ? 1 : -1;
      const rotateDeg = rotationSign * CONFIG.MAX_ROTATION_DEG * progress.value;

      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { rotate: `${rotateDeg}deg` },
          { scale: scale.value },
        ],
        // fade slightly at the bottom
        opacity: progress.value < 0.98 ? 1 : 0.99,
      };
    });

    return (
      <Animated.Text
        style={[
          {
            position: "absolute",
            fontSize: size,
            textShadowColor: "rgba(0,0,0,0.2)",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 4,
          },
          animatedStyle,
        ]}
      >
        {emoji}
      </Animated.Text>
    );
  },
);
FloatingEmoji.displayName = "FloatingEmoji";

// =================== MAIN SCREEN ===================
const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function Start() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  // Phase index
  const [phaseIndex, setPhaseIndex] = useState(0);
  // Stop spawning after final phase
  const [shouldSpawn, setShouldSpawn] = useState(true);

  // Our pool of 50 references
  const emojiRefs = useRef<FloatingEmojiRef[]>([]);
  const poolCursorRef = useRef(0);

  // Main logo reanimated
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const glowOpacity = useSharedValue(0);

  // =================== SPAWNING ===================
  useEffect(() => {
    if (!shouldSpawn) return undefined;

    const intervalId = setInterval(() => {
      const phase = CONFIG.PHASES[phaseIndex];
      const emoji = phase ? phase.emoji : "🔥";

      if (emojiRefs.current.length > 0) {
        const i = poolCursorRef.current;
        if (emojiRefs.current[i]) {
          emojiRefs.current[i].resetAndAnimate(emoji);
        }
        poolCursorRef.current = (i + 1) % MAX_EMOJI_POOL;
      }
    }, SPAWN_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [phaseIndex, shouldSpawn]);

  // =================== PHASE PROGRESSION ===================
  useEffect(() => {
    let isMounted = true;
    const runPhases = async () => {
      for (let i = 0; i < CONFIG.PHASES.length; i++) {
        if (!isMounted) return;
        setPhaseIndex(i);
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.PHASES[i]?.duration ?? 0),
        );
      }
      // Done with all phases
      setShouldSpawn(false);
    };

    void runPhases();
    return () => {
      isMounted = false;
    };
  }, []);

  // =================== SPLASH + LOGO ANIMATION ===================
  useEffect(() => {
    const animateStartup = async () => {
      // Let splash be visible for a bit, then hide
      await new Promise((resolve) => setTimeout(resolve, 300));
      await SplashScreen.hideAsync();

      // Big scale entrance
      scale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
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

      // Subtitle + button
      subtitleOpacity.value = withDelay(
        700,
        withSpring(1, { damping: 12, stiffness: 80 }),
      );
      subtitleTranslateY.value = withDelay(
        700,
        withSpring(0, { damping: 12, stiffness: 80 }),
      );

      buttonOpacity.value = withDelay(
        1000,
        withSpring(1, { damping: 12, stiffness: 80 }),
      );
      buttonTranslateY.value = withDelay(
        1000,
        withSpring(0, { damping: 12, stiffness: 80 }),
      );
    };

    void animateStartup();
  }, [
    scale,
    rotate,
    translateY,
    glowOpacity,
    subtitleOpacity,
    subtitleTranslateY,
    buttonOpacity,
    buttonTranslateY,
  ]);

  // =================== HANDLER ===================
  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (requiredPermissions) {
      router.push("/auth/phone-number");
    } else {
      router.push("/misc/permissions");
    }
  };

  // =================== ANIMATED STYLES ===================
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  // =================== RENDER ===================
  return (
    <ScreenView
      padding={0}
      backgroundColor="$primary"
      safeAreaEdges={["bottom"]}
    >
      {/* Pooled emojis, each arcs once. */}
      {Array.from({ length: MAX_EMOJI_POOL }, (_, i) => (
        <FloatingEmoji
          key={`emoji-${i}`}
          ref={(ref) => {
            if (ref) emojiRefs.current[i] = ref;
          }}
          size={CONFIG.EMOJI_SIZE}
        />
      ))}

      {/* Main Logo & UI */}
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

        <Animated.View style={animatedSubtitleStyle}>
          <H2
            textAlign="center"
            style={{
              textShadowColor: "rgba(0,0,0,0.2)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 10,
            }}
          >
            Other people post for you
          </H2>
        </Animated.View>
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
        <OnboardingButton
          onPress={onSubmit}
          isValid
          text="Welcome to Chaos 😈"
        />
      </Animated.View>
    </ScreenView>
  );
}
