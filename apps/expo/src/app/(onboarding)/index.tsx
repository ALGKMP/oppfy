import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
  INITIAL_SPAWN_INTERVAL: 100, // ms, for quick initial population
  NORMAL_SPAWN_INTERVAL: 200, // ms, for maintaining the count
  MIN_DURATION: 2000, // ms
  MAX_DURATION: 4000, // ms
  MAX_X_SPEED: 250, // pixels
  MAX_Y_SPEED: 250, // pixels
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

const Start = () => {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  const [cameras, setCameras] = React.useState<number[]>([]);
  const [isInitialSpawn, setIsInitialSpawn] = React.useState(true);

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

  React.useEffect(() => {
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

  const renderedCameras = useMemo(
    () => cameras.map((id) => <Camera key={id} />),
    [cameras],
  );

  return (
    <BaseScreenView safeAreaEdges={["bottom"]} paddingHorizontal={0}>
      <View style={{ position: "absolute", width: "100%", height: "100%" }}>
        {renderedCameras}
      </View>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$4"
      >
        <Text fontFamily="$modak" fontSize={96} margin={-34}>
          OPPFY
        </Text>
        <Text fontSize={24} fontWeight="700">
          Capture Real Memories.
        </Text>
      </YStack>
      <OnboardingButton onPress={onSubmit}>Welcome</OnboardingButton>
    </BaseScreenView>
  );
};

export default Start;
