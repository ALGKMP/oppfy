import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider, View } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "~/../tamagui.config";
import { Stack } from "~/layouts";

const RootLayout = () => {
  return (
    <TRPCProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <SafeAreaProvider>
          <View flex={1} backgroundColor="$background">
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="auth-welcome" />
              <Stack.Screen
                name="auth"
                options={{
                  animation: "fade_from_bottom",
                }}
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
