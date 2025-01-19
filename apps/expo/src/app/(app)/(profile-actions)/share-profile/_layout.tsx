import React from "react";
import { useRouter } from "expo-router";

import { Stack } from "~/components/Layouts/Navigation";
import { Icon } from "~/components/ui";

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
