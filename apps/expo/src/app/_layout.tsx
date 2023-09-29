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
    <TRPCProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={"dark"}>
        <SafeAreaProvider>
          {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
          <View flex={1} backgroundColor={"$background"}>
            {/* {showHeader && (
        <View
          height="$10"
          padding="$4"
          justifyContent="center"
          backgroundColor={"$background"}
        >
          <ChevronLeft size={24} onPress={() => router.back()} />
        </View>
      )} */}

            <Stack
              screenOptions={{
                header: () => (
                  <View
                    height="$10"
                    padding="$4"
                    justifyContent="center"
                    backgroundColor={"$background"}
                  >
                    {/* <Button icon={ChevronLeft} size={"$2"}/> */}
                    <ChevronLeft size={24} onPress={() => router.back()} />
                  </View>
                ),
                // headerShown: false
              }}
            >
              <Stack.Screen
                name="auth-welcome"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/email-input"
                options={{ title: "", animation: "fade_from_bottom" }}
              />

              <Stack.Screen
                name="auth/password-input"
                options={{ title: "", animation: "fade" }}
              />
            </Stack>
            <StatusBar />
          </View>
        </SafeAreaProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
