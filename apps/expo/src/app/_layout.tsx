import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider, Text } from "tamagui";

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
              headerTransparent: true 
            }}
          >
            <Stack.Screen 
            name="auth-welcome"
            options={{headerShown: false}}
            />
            <Stack.Screen 
            name="auth/email-input"
            options={{title:"", animation: "slide_from_right"}}
            />

            <Stack.Screen 
            name="auth/pass-input"
            options={{title:"", animation: "slide_from_right"}}
            />
          </Stack>
          <StatusBar />
        </SafeAreaProvider>
      </TamaguiProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
