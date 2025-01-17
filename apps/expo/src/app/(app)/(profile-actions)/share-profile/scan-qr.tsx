import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from "react-native-vision-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "@tamagui/linear-gradient";
import { CameraOff } from "@tamagui/lucide-icons";
import { View } from "tamagui";

import { EmptyPlaceholder, ScreenView } from "~/components/ui";

const { width } = Dimensions.get("window");

const GRADIENT_COLORS = ["#fc00ff", "#9700ff"];

const ScanQr = () => {
  const router = useRouter();
  const device = useCameraDevice("back");
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    };
    void checkPermissions();

    // Reset scanning state when component mounts
    setIsScanning(true);

    // Clean up function to reset state when component unmounts
    return () => {
      setIsScanning(true);
    };
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ["qr"],
    onCodeScanned: (codes) => {
      if (isScanning && codes.length > 0 && codes[0]?.value) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setIsScanning(false);
        const url = new URL(codes[0].value);

        const userId = url.searchParams.get("userId") ?? "";
        const username = url.searchParams.get("username") ?? "";

        setTimeout(() => {
          router.push({
            pathname: "/profile/[userId]",
            params: { userId, username },
          });
          // Reset scanning state after navigation
          setIsScanning(true);
        }, 100);
      }
    },
  });

  if (!hasPermission) {
    return (
      <ScreenView justifyContent="center" alignItems="center">
        <EmptyPlaceholder
          title="No camera device found"
          subtitle="Please check your camera settings and try again."
          icon={<CameraOff />}
        />
      </ScreenView>
    );
  }

  if (device === undefined) {
    return (
      <ScreenView justifyContent="center" alignItems="center">
        <EmptyPlaceholder
          title="No camera device found"
          subtitle="Please check your camera settings and try again."
          icon={<CameraOff />}
        />
      </ScreenView>
    );
  }

  return (
    <View flex={1} backgroundColor="$background">
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isScanning}
        codeScanner={codeScanner}
      />
      <LinearGradient
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={1}
        colors={GRADIENT_COLORS.map((color) => `${color}30`)}
      />
      <View
        position="absolute"
        top="35%"
        left="20%"
        width={width * 0.6}
        height={width * 0.6}
        zIndex={2}
      >
        <View
          position="absolute"
          top={0}
          left={0}
          width={30}
          height={30}
          borderTopWidth={5}
          borderLeftWidth={5}
          borderColor="rgba(128,128,128,0.9)"
          borderTopLeftRadius={14}
        />
        <View
          position="absolute"
          top={0}
          right={0}
          width={30}
          height={30}
          borderTopWidth={5}
          borderRightWidth={5}
          borderColor="rgba(128,128,128,0.9)"
          borderTopRightRadius={14}
        />
        <View
          position="absolute"
          bottom={0}
          left={0}
          width={30}
          height={30}
          borderBottomWidth={5}
          borderLeftWidth={5}
          borderColor="rgba(128,128,128,0.9)"
          borderBottomLeftRadius={14}
        />
        <View
          position="absolute"
          bottom={0}
          right={0}
          width={30}
          height={30}
          borderBottomWidth={5}
          borderRightWidth={5}
          borderColor="rgba(128,128,128,0.9)"
          borderBottomRightRadius={14}
        />
      </View>
    </View>
  );
};

export default ScanQr;
