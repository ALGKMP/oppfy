import React from "react";
import {
  Link,
  Redirect,
  useNavigation,
  useRootNavigation,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { getTokens, Text, View, XStack } from "tamagui";

import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const UserDetailsLayout = () => {
  const router = useRouter();
  const { user, signOut, deleteAccount, isSignedIn, isLoading } = useSession();

  const onExitPress = async () => {
    await signOut();
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isSignedIn) {
    return <Redirect href="/auth/phone-number" />;
  }

  return (
    <View flex={1} backgroundColor="$background">
      <Stack
        screenOptions={{
          headerTitle: "OPPFY",
          header: ({ navigation, options, back }) => (
            <XStack
              padding="$4"
              height="$6"
              alignItems="center"
              justifyContent="space-between"
            >
              <View>
                {back && (
                  <ChevronLeft size="$2" onPress={() => navigation.goBack()} />
                )}
              </View>

              <Text>OPPFY</Text>

              <Link href="https://help">
                <Text>Help</Text>
              </Link>
            </XStack>
          ),
          headerStyle: {
            backgroundColor: getTokens().color.gray1Dark.val,
          },
        }}
      >
        <Stack.Screen
          name="welcome"
          options={{
            animation: "fade",
            header: () => (
              <XStack
                padding="$4"
                height="$6"
                alignItems="center"
                justifyContent="space-between"
              >
                <View>
                  <ChevronLeft size="$2" onPress={onExitPress} />
                </View>

                <Text>OPPFY</Text>
              </XStack>
            ),
          }}
        />
        <Stack.Screen name="first-name" options={{ animation: "fade" }} />
        <Stack.Screen name="date-of-birth" options={{ animation: "fade" }} />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default UserDetailsLayout;
