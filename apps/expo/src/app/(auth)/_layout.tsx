import React from "react";
import { Link, useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { getTokens, Text, View, XStack } from "tamagui";

import { StackHeader } from "~/components/Headers";
import { Stack } from "~/layouts";

const AuthLayout = () => {
  return (
    <View flex={1} backgroundColor="black">
      <Stack
        screenOptions={{
          headerTitle: () => (
            <Text fontSize={22} fontWeight="600">
              OPPFY
            </Text>
          ),
          headerRight: () => (
            <Text fontWeight="500" fontSize={16}>
              Help
            </Text>
          ),
          header: ({ navigation, options, back }) => (
            <StackHeader
              navigation={navigation}
              options={options}
              back={back}
            />
          ),
        }}
      >
        <Stack.Screen name="phone-number" options={{ animation: "fade" }} />
        <Stack.Screen name="pin-code-otp" options={{ animation: "fade" }} />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default AuthLayout;
