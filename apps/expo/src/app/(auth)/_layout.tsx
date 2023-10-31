import React from "react";
import { Link, useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { getTokens, Text, View, XStack } from "tamagui";

import { Stack } from "~/layouts";

const AuthLayout = () => {
  return (
    <View flex={1} backgroundColor="$backgroundStrong">
      <Stack
        screenOptions={{
          header: ({ navigation, options, back }) => (
            <XStack
              padding="$6"
              alignItems="center"
              justifyContent="space-between"
              style={{ backgroundColor: "black" }}
            >
              <View width="$4">
                {back && (
                  <ChevronLeft
                    size="$1.5"
                    onPress={() => navigation.goBack()}
                  />
                )}
              </View>

              <Text fontSize={22} fontWeight="600">
                OPPFY
              </Text>

              <View width="$4">
                <Text fontWeight="500" fontSize={16}>
                  Help
                </Text>
              </View>
            </XStack>
          ),
          headerStyle: {
            backgroundColor: "black",
          },
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
