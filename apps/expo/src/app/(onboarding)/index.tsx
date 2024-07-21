import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Text, YStack } from "tamagui";

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

const AnimatedText = Animated.createAnimatedComponent(Text);

const Start = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  const [cameras, setCameras] = useState<number[]>([]);
  const [isInitialSpawn, setIsInitialSpawn] = useState(true);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  // const colorAnimation = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);

  const onSubmit = useCallback(() => {
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
    scale.value = withSequence(
      withTiming(1.2, { duration: 500, easing: Easing.bounce }),
      withTiming(1, { duration: 300 }),
    );

    rotate.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    );

    translateY.value = withSequence(
      withTiming(-50, { duration: 500 }),
      withTiming(0, { duration: 500 }),
    );

    // colorAnimation.value = withSequence(
    //   withTiming(1, { duration: 500 }),
    //   withTiming(2, { duration: 500 }),
    //   withTiming(3, { duration: 500 }),
    //   withTiming(4, { duration: 500 }),
    //   withTiming(5, { duration: 500 }),
    // );

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
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
      { translateY: translateY.value },
    ],
    // color: interpolateColor(
    //   colorAnimation.value,
    //   [0, 1, 2, 3, 4, 5],
    //   ["#FFFFFF", "#00FFFF", "#ff1100", "#FFFF00", "#FF8000", "#FFFFFF"]
    // ),
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
    <BaseScreenView safeAreaEdges={["top", "bottom"]} paddingHorizontal={0} backgroundColor={"#F214FF"}>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$4"
        paddingVertical="$8"
      >
        <View style={{ position: "absolute", width: "100%", height: "100%" }}>
          {renderedCameras}
        </View>

        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <AnimatedText
            fontFamily="$modak"
            fontSize={96}
            margin={-34}
            style={animatedTextStyle}
          >
            OPPFY
          </AnimatedText>
          <Animated.View style={animatedSubtitleStyle}>
            <Text fontSize={24} color="white">
              Other people post for you
            </Text>
          </Animated.View>
        </View>
      </YStack>
      <Animated.View style={animatedButtonStyle}>
        <OnboardingButton onPress={onSubmit}>Welcome</OnboardingButton>
      </Animated.View>
    </BaseScreenView>
  );
};

export default Start;