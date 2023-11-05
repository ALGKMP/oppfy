import React from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { getTokens, Text, View, XStack } from "tamagui";

import StackHeader from "~/components/Headers/StackHeader";
import { Stack } from "~/layouts";

const ProfileLayout = () => {
  const router = useRouter();
  const rootNavigation = useRootNavigation();

  return (
    <View flex={1} backgroundColor="black">
      <Stack
        screenOptions={{
          header: ({ navigation, options, back }) => (
            <StackHeader
              navigation={navigation}
              options={options}
              back={back}
            />
          ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerLeft: () => null,
            headerRight: () => (
              <View>
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
          options={{
            title: "Settings",
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications", animation: "fade" }}
        />

        <Stack.Screen
          name="other"
          options={{ title: "Other", animation: "fade" }}
        />
      </Stack>
    </View>
  );
};

export default ProfileLayout;
