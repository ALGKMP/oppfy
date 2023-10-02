import React from "react";
import { useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { getTokens, View } from "tamagui";

import { Stack } from "~/layouts";

const AuthLayout = () => {
  // const router = useRouter();
  // const navigation = useNavigation();
  const rootNavigation = useRootNavigation();

  return (
    <View flex={1} backgroundColor="$background">
      <Stack
        screenOptions={{
          headerTitle: "",
          headerStyle: {
            backgroundColor: getTokens().color.gray1Dark.val,
          },
          headerLeft: () => (
            <ChevronLeft size="$2" onPress={() => rootNavigation?.goBack()} />
          ),
        }}
      >
        <Stack.Screen
          name="email-input"
          options={{ title: "", animation: "fade" }}
        />

        <Stack.Screen
          name="password-input"
          options={{ title: "", animation: "fade" }}
        />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default AuthLayout;
