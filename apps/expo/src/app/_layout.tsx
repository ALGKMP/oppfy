import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { Modak_400Regular } from "@expo-google-fonts/modak";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
            <ActionSheetProvider>
              <SafeAreaProvider>
                <Slot />
              </SafeAreaProvider>
            </ActionSheetProvider>
          </PermissionsProvider>
        </SessionProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
