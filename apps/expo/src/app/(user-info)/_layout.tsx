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
          name="welcome"
          options={{
            animation: "fade",
            headerLeft: () => (
              <AlertDialog>
                <AlertDialog.Trigger asChild>
                  <View>
                    <ChevronLeft size="$1.5" />
                  </View>
                </AlertDialog.Trigger>

                <AlertDialog.Portal>
                  <AlertDialog.Overlay
                    key="overlay"
                    animation="quick"
                    opacity={0.5}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                  />
                  <AlertDialog.Content
                    backgroundColor="white"
                    bordered
                    elevate
                    key="content"
                    animation={[
                      "quick",
                      {
                        opacity: {
                          overshootClamping: true,
                        },
                      },
                    ]}
                    borderRadius={16}
                    enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                    exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                    x={0}
                    scale={1}
                    opacity={1}
                    y={0}
                  >
                    <YStack
                      alignItems="center"
                      padding="$2"
                      width={240}
                      space={12}
                    >
                      <AlertDialog.Title
                        color="black"
                        fontWeight="bold"
                        fontSize={20}
                      >
                        OPPFY
                      </AlertDialog.Title>
                      <AlertDialog.Description
                        color="black"
                        textAlign="center"
                        fontSize={10}
                        lineHeight={14}
                        fontWeight="bold"
                      >
                        Are you sure you want to quit? You'll lose any changes
                        you've made.
                      </AlertDialog.Description>

                      <YStack width="100%" space={10}>
                        <AlertDialog.Cancel asChild>
                          <Button backgroundColor="black" size="$3">
                            Stay
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button size="$3" themeInverse onPress={onExitPress}>
                            Leave
                          </Button>
                        </AlertDialog.Action>
                      </YStack>
                    </YStack>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog>
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
