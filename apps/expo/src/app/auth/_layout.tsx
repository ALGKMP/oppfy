import React from "react";
import { Link, useNavigation, useRootNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "@tamagui/lucide-icons";
import { getTokens, Text, View, XStack } from "tamagui";

import { Stack } from "~/layouts";

const AuthLayout = () => {
  // const router = useRouter();
  // const navigation = useNavigation();
  const rootNavigation = useRootNavigation();

  return (
    <View flex={1} backgroundColor="$background">
      <Stack
        screenOptions={{
          headerTitle: "OPPFY",
          header: ({ navigation, options, back }) => (
            <XStack padding="$4" height="$6" alignItems="center" justifyContent="space-between">
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
          name="phone-number"
          options={{ animation: "fade", headerBackVisible: false }}
        />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default AuthLayout;
