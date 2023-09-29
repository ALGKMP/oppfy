import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "~/../tamagui.config";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <TRPCProvider>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={"dark"}>
        <SafeAreaProvider>
          {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "blue",
              },
            }}
          >
            <Stack.Screen 
            name="auth/index"
            options={{headerShown: false}}
            />
          </Stack>
          <StatusBar />
        </SafeAreaProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
