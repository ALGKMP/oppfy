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

import { api } from "~/utils/api";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const WelcomeLayout = () => {
  const router = useRouter();
  const { user, signOut, isSignedIn, isLoading } = useSession();

  const deleteUser = api.auth.deleteUser.useMutation();

  const onAccountDeletion = async () => {
    await deleteUser.mutateAsync();
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
          headerStyle: {
            backgroundColor: getTokens().color.gray1Dark.val,
          },
        }}
      >
        <Stack.Screen
          name="index"
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
                  <ChevronLeft size="$2" onPress={onAccountDeletion} />
                </View>

                <Text>OPPFY</Text>
              </XStack>
            ),
          }}
        />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default WelcomeLayout;
