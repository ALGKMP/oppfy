import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { SplashScreen, useRouter } from "expo-router";
import Splash from "@assets/splash.png";
import { H4 } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { usePermissions } from "~/contexts/PermissionsContext";
import { OnboardingButton } from "~/features/onboarding/components";

const { width, height } = Dimensions.get("window");

const CONFIG = {
  MAX_CAMERAS: 50,
  CAMERA_SIZE: 30,
  INITIAL_SPAWN_INTERVAL: 100,
  NORMAL_SPAWN_INTERVAL: 200,
  MIN_DURATION: 2000,
  MAX_DURATION: 4000,
  MAX_X_SPEED: 250,
  MAX_Y_SPEED: 250,
};

const Camera = memo(() => {
  const translateY = useSharedValue(-CONFIG.CAMERA_SIZE);
  const translateX = useSharedValue(Math.random() * width);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  useEffect(() => {
    const duration =
      CONFIG.MIN_DURATION +
      Math.random() * (CONFIG.MAX_DURATION - CONFIG.MIN_DURATION);
    const yDistance = height + CONFIG.CAMERA_SIZE * 2;
    const ySpeed = Math.min(yDistance / (duration / 1000), CONFIG.MAX_Y_SPEED);
    const adjustedDuration = (yDistance / ySpeed) * 1000;

    translateY.value = withTiming(yDistance, {
      duration: adjustedDuration,
      easing: Easing.linear,
    });

    translateX.value = withTiming(
      translateX.value + (Math.random() - 0.5) * CONFIG.MAX_X_SPEED * 2,
      { duration: adjustedDuration, easing: Easing.linear },
    );

    rotate.value = withRepeat(
      withTiming(360, {
        duration: adjustedDuration / 3,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotate, translateX, translateY]);

  return (
    <Animated.Text
      style={[
        { position: "absolute", fontSize: CONFIG.CAMERA_SIZE },
        animatedStyle,
      ]}
    >
      📸
    </Animated.Text>
  );
});

const AnimatedImage = Animated.createAnimatedComponent(Image);

const Start = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  const [cameras, setCameras] = useState<number[]>([]);
  const [isInitialSpawn, setIsInitialSpawn] = useState(true);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);

  const onSubmit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    requiredPermissions
      ? router.push("/auth/phone-number")
      : router.push("/misc/permissions");
  }, [requiredPermissions, router]);

  const addCamera = useCallback(() => {
    setCameras((prev) => {
      if (prev.length >= CONFIG.MAX_CAMERAS) {
        return [...prev.slice(1), Date.now()];
      }
      return [...prev, Date.now()];
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => {
        addCamera();
        if (cameras.length >= CONFIG.MAX_CAMERAS && isInitialSpawn) {
          setIsInitialSpawn(false);
        }
      },
      isInitialSpawn
        ? CONFIG.INITIAL_SPAWN_INTERVAL
        : CONFIG.NORMAL_SPAWN_INTERVAL,
    );

    return () => clearInterval(interval);
  }, [addCamera, cameras.length, isInitialSpawn]);

  useEffect(() => {
    const fn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await SplashScreen.hideAsync();

      scale.value = withSequence(
        withTiming(0.9, { duration: 1500, easing: Easing.bounce }),
        withTiming(1, { duration: 300 }),
      );

      rotate.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );

      translateY.value = withSequence(
        withTiming(-30, { duration: 500 }),
        withTiming(0, { duration: 500 }),
      );

      subtitleOpacity.value = withDelay(1800, withTiming(1, { duration: 800 }));
      subtitleTranslateY.value = withDelay(
        1800,
        withTiming(0, { duration: 800, easing: Easing.out(Easing.back(2)) }),
      );

      buttonOpacity.value = withDelay(2200, withTiming(1, { duration: 500 }));
      buttonTranslateY.value = withDelay(
        2200,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.back(2)) }),
      );
    };

    void fn();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const renderedCameras = useMemo(
    () => cameras.map((id) => <Camera key={id} />),
    [cameras],
  );

  return (
    <BaseScreenView
      padding={0}
      backgroundColor="#F214FF"
      safeAreaEdges={["top", "bottom"]}
      bottomSafeAreaStyle={{ backgroundColor: "#F214FF" }}
      topSafeAreaStyle={{ backgroundColor: "#F214FF" }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ position: "absolute", width: "100%", height: "100%" }}>
          {renderedCameras}
        </View>

        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AnimatedImage
            source={Splash}
            style={[
              {
                width: "100%",
                aspectRatio: 4,
                resizeMode: "contain",
              },
              animatedIconStyle,
            ]}
            contentFit="contain"
          />
          <Animated.View style={[animatedSubtitleStyle]}>
            <H4 fontSize={24} color="white" textAlign="center">
              Other people post for you
            </H4>
          </Animated.View>
        </View>

        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <Animated.View style={animatedButtonStyle}>
            <OnboardingButton onPress={onSubmit}>Welcome</OnboardingButton>
          </Animated.View>
        </View>
      </View>
    </BaseScreenView>
  );
};

export default Start;
