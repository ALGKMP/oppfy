import React, { useEffect } from "react";
import {
  Animated,
  Easing,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SplashScreen, useNavigation, useRouter } from "expo-router";
import { AnimatePresence } from "@tamagui/animate-presence";
import { LinearGradient } from "@tamagui/linear-gradient";
import { ArrowRight, Sparkles, X } from "@tamagui/lucide-icons";

import {
  Circle,
  H1,
  OnboardingButton,
  Paragraph,
  ScreenView,
  Text,
  useAlertDialogController,
  XStack,
  YStack,
} from "~/components/ui";
import { useSession } from "~/contexts/SessionContext";

interface OrbitingCircleProps {
  size: number;
  orbitSize: number;
  speed: number;
  delay: number;
  clockwise?: boolean;
}

const OrbitingCircle: React.FC<OrbitingCircleProps> = ({
  size,
  orbitSize,
  speed,
  delay,
  clockwise = true,
}) => {
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: speed,
        easing: Easing.linear,
        delay,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue, speed, delay]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ["0deg", "360deg"] : ["360deg", "0deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        transform: [{ rotate }, { translateX: orbitSize / 2 }],
      }}
    >
      <Circle
        size={size}
        backgroundColor="$primary"
        opacity={0.15}
        animation="bouncy"
        enterStyle={{ scale: 0.5, opacity: 0 }}
        pressStyle={{ scale: 1.1 }}
      />
    </Animated.View>
  );
};

const PulsingSparkles: React.FC<{ size: number }> = ({ size }) => {
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [scaleValue]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <Sparkles size={size} color="white" />
    </Animated.View>
  );
};

interface FloatingBubbleProps {
  x: number;
  y: number;
  size: number;
  delay?: number;
}

// Floating bubble component with random animation timing
const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  x,
  y,
  size,
  delay = 0,
}) => (
  <Circle
    position="absolute"
    left={x}
    top={y}
    size={size}
    backgroundColor="$primary"
    opacity={0.08}
    animation="bouncy"
    enterStyle={{ scale: 0.5, opacity: 0 }}
    pressStyle={{ scale: 1.1 }}
    style={{
      transform: [{ translateY: 0 }],
    }}
  />
);

const Welcome = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const alertDialog = useAlertDialogController();
  const { signOut } = useSession();

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          hitSlop={10}
          onPress={async () => {
            const confirmed = await alertDialog.show({
              title: "Exit Onboarding",
              subtitle:
                "Are you sure you want to quit? You'll lose any changes you've made.",
              acceptText: "Exit",
              cancelText: "Cancel",
            });

            if (confirmed) {
              await signOut();
            }
          }}
        >
          <X color="$gray11" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, signOut, alertDialog]);

  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/user-info/name");
  };

  useEffect(() => void SplashScreen.hideAsync(), []);

  return (
    <ScreenView
      backgroundColor="$background"
      paddingBottom={0}
      safeAreaEdges={["bottom"]}
      justifyContent="space-between"
      animation="bouncy"
    >
      {/* Background Elements */}
      <YStack
        position="absolute"
        width="120%"
        height="120%"
        left="-10%"
        top="-10%"
        overflow="hidden"
      >
        <LinearGradient
          width="100%"
          height="100%"
          colors={["$background", "$primary", "$background"]}
          start={[0, 0]}
          end={[1, 1]}
          opacity={0.02}
          scale={1.2}
        />

        {/* Floating Bubbles */}
        <AnimatePresence>
          <FloatingBubble
            key="bubble1"
            x={width * 0.1}
            y={height * 0.2}
            size={width * 0.15}
          />
          <FloatingBubble
            key="bubble2"
            x={width * 0.75}
            y={height * 0.15}
            size={width * 0.1}
          />
          <FloatingBubble
            key="bubble3"
            x={width * 0.2}
            y={height * 0.7}
            size={width * 0.12}
          />
          <FloatingBubble
            key="bubble4"
            x={width * 0.8}
            y={height * 0.6}
            size={width * 0.08}
          />
          <FloatingBubble
            key="bubble5"
            x={width * 0.15}
            y={height * 0.4}
            size={width * 0.06}
          />
          <FloatingBubble
            key="bubble6"
            x={width * 0.7}
            y={height * 0.8}
            size={width * 0.1}
          />
        </AnimatePresence>
      </YStack>

      <YStack
        flex={1}
        gap="$8"
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="$4"
      >
        <AnimatePresence>
          {/* Main Content */}
          <YStack
            animation="bouncy"
            enterStyle={{
              y: 20,
              opacity: 0,
            }}
            y={0}
            opacity={1}
            gap="$12"
            maxWidth={600}
            alignItems="center"
          >
            {/* Animated Icon */}
            <YStack
              animation="bouncy"
              enterStyle={{ scale: 0.8, opacity: 0 }}
              pressStyle={{ scale: 0.97 }}
              position="relative"
              alignItems="center"
              justifyContent="center"
            >
              {/* Orbiting Circles */}
              <OrbitingCircle
                size={15}
                orbitSize={width * 0.5}
                speed={8000}
                delay={0}
              />
              <OrbitingCircle
                size={12}
                orbitSize={width * 0.45}
                speed={6000}
                delay={200}
                clockwise={false}
              />
              <OrbitingCircle
                size={10}
                orbitSize={width * 0.4}
                speed={10000}
                delay={400}
              />
              <OrbitingCircle
                size={8}
                orbitSize={width * 0.35}
                speed={7000}
                delay={600}
                clockwise={false}
              />

              {/* Central Icon */}
              <Circle
                size={width * 0.38}
                backgroundColor="$background"
                borderWidth={1.5}
                borderColor="$primary"
                shadowColor="$primary"
                shadowOpacity={0.15}
                shadowRadius={40}
                pressStyle={{
                  scale: 1.02,
                  backgroundColor: "$backgroundHover",
                }}
              >
                <Circle
                  size={width * 0.32}
                  backgroundColor="$background"
                  borderWidth={1.5}
                  borderColor="$primary"
                  opacity={0.7}
                >
                  <Circle
                    size={width * 0.2}
                    backgroundColor="$primary"
                    shadowColor="$primary"
                    shadowOpacity={0.5}
                    shadowRadius={20}
                  >
                    <PulsingSparkles size={width * 0.1} />
                  </Circle>
                </Circle>
              </Circle>
            </YStack>

            {/* Text Content */}
            <YStack gap="$4" alignItems="center">
              <H1
                size="$9"
                textAlign="center"
                letterSpacing={-1}
                animation="bouncy"
                enterStyle={{ y: -20, opacity: 0 }}
              >
                Hi there!
              </H1>

              <Paragraph
                size="$6"
                color="$gray11"
                textAlign="center"
                maxWidth={320}
                animation="bouncy"
              >
                Let's get your profile set up in just a few quick steps
              </Paragraph>
            </YStack>
          </YStack>
        </AnimatePresence>
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        onPress={onSubmit}
        variant="primary"
        textProps={{
          fontWeight: "bold",
          fontSize: 18,
        }}
      >
        Get Started
      </OnboardingButton>
    </ScreenView>
  );
};

export default Welcome;
