import React, { useEffect } from "react";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Maya from "@assets/onboarding/Maya.png";
import { Text, View, YStack } from "tamagui";

import { ScreenView } from "~/components/ui";
import { usePermissions } from "~/contexts/PermissionsContext";

export default function Screen1() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const requiredPermissions = permissions.camera && permissions.contacts;

  useEffect(() => {
    // Wait 3 seconds then route to next screen
    const timer = setTimeout(() => {
      router.push("/tutorial/screen2");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScreenView padding={0} safeAreaEdges={["bottom"]}>
      <YStack flex={1} justifyContent="center" alignItems="center">
        {/* Full background collage with randomized images */}
        <Image
          source={Maya}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />
        {/* Gradient Overlay and Text */}
        <YStack
          position="absolute"
          bottom={0}
          width="100%"
          height="100%"
          justifyContent="flex-end"
        >
          <LinearGradient
            colors={["transparent", "#F214FF"]}
            locations={[0.6, 1.0]}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <YStack paddingBottom={40} alignItems="center">
              <Text
                fontSize={32}
                fontWeight="bold"
                color="white"
                textAlign="center"
                marginBottom={40}
              >
                post for your friends
              </Text>
            </YStack>
          </LinearGradient>
        </YStack>
      </YStack>
    </ScreenView>
  );
}
