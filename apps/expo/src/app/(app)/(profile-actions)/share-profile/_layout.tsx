import React from "react";
import { Linking } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";
import { useRouter } from "expo-router";

import { Stack } from "~/components/Layouts/Navigation";
import { Icon, useAlertDialogController } from "~/components/ui";

const ShareProfileLayout = () => {
  const router = useRouter();
  const cameraPermission = useCameraPermission();
  const dialog = useAlertDialogController();

  const handleQRNavigation = async () => {
    if (!cameraPermission.hasPermission) {
      const confirmed = await dialog.show({
        title: "Camera Permission Required",
        subtitle:
          "Camera access is needed to scan QR codes. You can enable it in your device settings.",
        cancelText: "Cancel",
        acceptText: "Open Settings",
        acceptTextProps: {
          color: "$blue9",
        },
        cancelTextProps: {
          color: "$gray9",
        },
      });

      if (confirmed) {
        await Linking.openSettings();
      }
      return;
    }

    router.navigate("/share-profile/scan-qr");
  };

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Share Profile",
          headerLeft: () => (
            <Icon name="chevron-back" onPress={() => router.back()} blurred />
          ),
          headerRight: () => (
            <Icon name="qr-code" onPress={handleQRNavigation} blurred />
          ),
        }}
      />

      <Stack.Screen
        name="scan-qr"
        options={{
          title: "Scan QR",
          animation: "fade",
          headerLeft: () => (
            <Icon name="close" onPress={() => router.back()} blurred />
          ),
        }}
      />
    </Stack>
  );
};

export default ShareProfileLayout;
