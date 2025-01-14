import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, QrCode, X } from "@tamagui/lucide-icons";

import { Icon } from "~/components/ui";
import { Stack } from "~/layouts";

const ShareProfileLayout = () => {
  const router = useRouter();

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
            // <TouchableOpacity
            //   onPress={() => {
            //     router.navigate("/share-profile/scan-qr");
            //   }}
            // >
            //   <QrCode />
            // </TouchableOpacity>
            <Icon
              name="qr-code"
              onPress={() => router.navigate("/share-profile/scan-qr")}
              blurred
            />
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
