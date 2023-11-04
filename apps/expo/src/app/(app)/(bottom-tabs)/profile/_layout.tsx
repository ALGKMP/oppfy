import React from "react";
import { Pressable } from "react-native";
import { useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { getTokens, Text, View } from "tamagui";

import { Stack } from "~/layouts";

const ProfileLayout = () => {
  const router = useRouter();
  const rootNavigation = useRootNavigation();

  return (
    <View flex={1} backgroundColor="black">
      <Stack
        screenOptions={{
          // always go back to the root navigation
          // when going back from the profile
          // screen

          
          headerTitle: "",
          headerStyle: {
            backgroundColor: "black",
          },
          headerLeft: () => (
            <ChevronLeft size="$2" onPress={() => router?.back()} />
          ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerLeft: () => null,
            headerRight: () => (
              <View marginRight="$4">
                <Pressable onPress={() => router.push("/profile/settings")}>
                  {({ pressed }) => (
                    <MoreHorizontal
                      size="$1"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </View>
            ),
          }}
        />

        <Stack.Screen
          name="settings"
          options={{ title: "", animation: "fade" }}
        />
      </Stack>

      <StatusBar />
    </View>
  );
};

export default ProfileLayout;
