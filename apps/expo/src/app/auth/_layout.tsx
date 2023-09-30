import React from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { View } from "tamagui";

const AuthLayout = () => {
  const router = useRouter();

  return (
    <View flex={1} backgroundColor="$background">
      <Stack
        screenOptions={{
          header: () => (
            <View
              height="$10"
              padding="$4"
              justifyContent="center"
              backgroundColor="$background"
            >
              <ChevronLeft size={24} onPress={() => router.back()} />
            </View>
          ),
        }}
      >
        <Stack.Screen
          name="email-input"
          options={{ title: "", animation: "fade_from_bottom" }}
        />

        <Stack.Screen
          name="password-input"
          options={{ title: "", animation: "fade" }}
        />
        <Stack.Screen
          name="sign-in"
          options={{ title: "", animation: "fade" }}
        />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default AuthLayout;
