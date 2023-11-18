import React, { useState } from "react";
import {
  Link,
  Redirect,
  useNavigation,
  useRootNavigation,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import {
  AlertDialog,
  Button,
  getTokens,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { StackHeader } from "~/components/Headers";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const UserDetailsLayout = () => {
  const router = useRouter();
  const { user, signOut, deleteAccount, isSignedIn, isLoading } = useSession();

  const onExitPress = async () => {
    await signOut();
  };

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
        <Stack.Screen
          name="index"
          options={{ animation: "fade", header: () => null }}
        />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default UserDetailsLayout;
