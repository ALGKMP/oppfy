import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { Button, TamaguiProvider, Text, View } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "~/../tamagui.config";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine if you're in the auth flow
  // const showHeader = [
  //   "/auth/email-input",
  //   "/auth/password-input"
  // // ].includes(pathname);
  // ].includes(pathname);

  return (
    <SafeAreaProvider>
      <TRPCProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <View flex={1} backgroundColor="$background">

            {/* Auth Stack */}
            <Stack screenOptions={{headerShown: false}}>
              <Stack.Screen
                name="auth-welcome"
              />

            </Stack>
            <StatusBar />
          </View>
        </TamaguiProvider>
      </TRPCProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
