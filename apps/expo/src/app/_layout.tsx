import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider, View } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "~/../tamagui.config";
import { Stack } from "~/layouts";
import SessionProvider, { useSession } from "../contexts/SessionsContext";

const RootLayout = () => {
  return (
    <TRPCProvider>
      <SessionProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <SafeAreaProvider>
            <View flex={1} backgroundColor="$background">
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen
                  name="auth"
                  options={{
                    animation: "fade_from_bottom",
                  }}
                />
              </Stack>
              <StatusBar />
            </View>
            {/* <Slot/> */}
          </SafeAreaProvider>
        </TamaguiProvider>
      </SessionProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
