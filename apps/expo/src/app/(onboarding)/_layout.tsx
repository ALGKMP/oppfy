import React from "react";
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: "fade",
        }}
      />

      {/* Main route groups */}
      <Stack.Screen
        name="auth"
        options={{
          animation: "fade",
        }}
      />

      <Stack.Screen
        name="user-info"
        options={{
          animation: "fade",
        }}
      />

      <Stack.Screen
        name="tutorial"
        options={{
          animation: "fade",
        }}
      />

      {/* Misc screens like permissions that can be accessed from anywhere */}
      <Stack.Screen
        name="misc"
        options={{
          animation: "fade",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
