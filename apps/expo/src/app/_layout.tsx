import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Modak_400Regular } from "@expo-google-fonts/modak";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiProvider, View } from "tamagui";

import { PermissionsProvider } from "~/contexts/PermissionsContext";
import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "../../tamagui.config";
import SessionProvider from "../contexts/SessionsContext";

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    Modak: Modak_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  const queryClient = new QueryClient();

  return (
    <TRPCProvider>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <SessionProvider>
            <PermissionsProvider>
              <ActionSheetProvider>
                <SafeAreaProvider>
                  <View flex={1} backgroundColor="black">
                    <Slot />
                    <StatusBar />
                  </View>
                </SafeAreaProvider>
              </ActionSheetProvider>
            </PermissionsProvider>
          </SessionProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
