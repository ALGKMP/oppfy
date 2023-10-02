import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Redirect, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import auth from "@react-native-firebase/auth";
import { TamaguiProvider, Text, View } from "tamagui";

import { TRPCProvider } from "~/utils/api";
import tamaguiConfig from "~/../tamagui.config";
import { Stack } from "~/layouts";
import SessionProvider from "../contexts/SessionsContext";

// TODO: handle auth flow states before initial app render
// 1. signed in -> redirect to feed
// 2. signed out -> redirect to auth
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
          </SafeAreaProvider>
        </TamaguiProvider>
      </SessionProvider>
    </TRPCProvider>
  );
};

export default RootLayout;
