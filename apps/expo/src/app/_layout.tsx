import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import {
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { Modak_400Regular } from "@expo-google-fonts/modak";
import { TamaguiProvider } from "tamagui";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { useNotificationObserver } from "~/hooks/notifications";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionContext";

const RootLayout = () => {
  useNotificationObserver();

  const [fontsLoaded] = useFonts({
    Modak_400Regular,

    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TRPCProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <SessionProvider>
          <PermissionsProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Slot />
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </PermissionsProvider>
        </SessionProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
