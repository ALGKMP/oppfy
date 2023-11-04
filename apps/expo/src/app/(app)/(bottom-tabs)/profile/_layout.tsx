import React from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, MoreHorizontal } from "@tamagui/lucide-icons";
import { getTokens, Text, View, XStack } from "tamagui";

import { Stack } from "~/layouts";

const ProfileLayout = () => {
  const router = useRouter();
  const rootNavigation = useRootNavigation();

  return (
    <View flex={1} backgroundColor="black">
      <Stack
        screenOptions={{
          header: ({ navigation, options, back }) => (
            <XStack
              padding="$6"
              alignItems="center"
              justifyContent="space-between"
              style={{ backgroundColor: "black" }}
            >
              <View width="$4" alignItems="flex-start">
                {back ? (
                  options.headerLeft ? (
                    options.headerLeft({ canGoBack: navigation.canGoBack() })
                  ) : (
                    <ChevronLeft
                      size="$1.5"
                      onPress={() => navigation.goBack()}
                    />
                  )
                ) : (
                  // Render a placeholder to keep the header balanced if there's no back option
                  <View width={48} /> // Adjust the width to match your back button's width
                )}
              </View>

              <Text fontSize={16} fontWeight="600">
                {options.headerTitle
                  ? options.headerTitle
                  : options.title
                  ? options.title
                  : null}
              </Text>

              <View width="$4" alignItems="flex-end">
                {options.headerRight &&
                  options.headerRight({ canGoBack: navigation.canGoBack() })}
              </View>
            </XStack>
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
