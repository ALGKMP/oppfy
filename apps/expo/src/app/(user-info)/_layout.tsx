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
    return <Redirect href="/(auth)/phone-number" />;
  }

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
        <Stack.Screen
          name="welcome"
          options={{
            animation: "fade",
            header: () => (
              <XStack
                padding="$6"
                alignItems="center"
                justifyContent="space-between"
                style={{ backgroundColor: "black" }}
              >
                <View width="$4">
                  <AlertDialog>
                    <AlertDialog.Trigger asChild>
                      <ChevronLeft size="$1.5" />
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
                            Are you sure you want to quit? You'll lose any
                            changes you've made.
                          </AlertDialog.Description>

                          <YStack width="100%" space={10}>
                            <AlertDialog.Cancel asChild>
                              <Button backgroundColor="black" size="$3">
                                Stay
                              </Button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <Button
                                size="$3"
                                themeInverse
                                onPress={onExitPress}
                              >
                                Leave
                              </Button>
                            </AlertDialog.Action>
                          </YStack>
                        </YStack>
                      </AlertDialog.Content>
                    </AlertDialog.Portal>
                  </AlertDialog>
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
