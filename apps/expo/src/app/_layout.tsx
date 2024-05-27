import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { Modak_400Regular } from "@expo-google-fonts/modak";
import { TamaguiProvider } from "tamagui";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionContext";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    Modak: Modak_400Regular,
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
