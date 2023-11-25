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
            title: "Settings",
          }}
        />

        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications", animation: "fade" }}
        />

        <Stack.Screen
          name="privacy"
          options={{ title: "Privacy", animation: "fade" }}
        />
        <Stack.Screen
          name="blocked-users"
          options={{ title: "Blocked Users", animation: "fade" }}
        />

        <Stack.Screen
          name="other"
          options={{ title: "Other", animation: "fade" }}
        />
        <Stack.Screen
          name="delete-account"
          options={{
            title: "Delete Account",
            presentation: "modal",
            animation: "slide_from_bottom",
            headerLeft: () => null,
            headerRight: () => null,
          }}
        />

        <Stack.Screen
          name="help"
          options={{ title: "Help", animation: "fade" }}
        />
        <Stack.Screen
          name="contact-us"
          options={{ title: "Contact Us", animation: "fade" }}
        />

        <Stack.Screen
          name="about"
          options={{ title: "About", animation: "fade" }}
        />
      </Stack>
    </View>
  );
};

export default ProfileLayout;
