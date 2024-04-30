import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Info } from "@tamagui/lucide-icons";
import { AlertDialog, Button, Text, View, YStack } from "tamagui";

import { Header } from "~/components/Headers";
import { useSession } from "~/contexts/SessionsContext";
import { Stack } from "~/layouts";

const OnboardingLayout = () => {
  const router = useRouter();
  const { signOut } = useSession();

  const insets = useSafeAreaInsets();

  return (
    <View
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
    >
      <Stack
        screenOptions={{
          headerTitle: () => (
            <Text fontFamily="$modak" fontSize="$9">
              OPPFY
            </Text>
          ),
          headerLeft: ({ canGoBack }) => (
            <TouchableOpacity
              hitSlop={10}
              onPress={() => {
                canGoBack ? void router.back() : null;
              }}
            >
              <ChevronLeft />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              hitSlop={10}
              onPress={() => {
                void Linking.openURL("https://www.oppfy.com");
              }}
            >
              <Info />
            </TouchableOpacity>
          ),
          header: ({ navigation, options }) => (
            <Header
              HeaderLeft={
                options.headerLeft
                  ? options.headerLeft({
                      canGoBack: navigation.canGoBack(),
                      tintColor: options.headerTintColor,
                    })
                  : undefined
              }
              HeaderTitle={
                typeof options.headerTitle === "function" ? (
                  options.headerTitle({
                    children: options.title ?? "",
                    tintColor: options.headerTintColor,
                  })
                ) : options.title ? (
                  <Text>{options.title}</Text>
                ) : null
              }
              HeaderRight={
                options.headerRight
                  ? options.headerRight({
                      canGoBack: navigation.canGoBack(),
                      tintColor: options.headerTintColor,
                    })
                  : undefined
              }
            />
          ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{ animation: "fade", header: () => null }}
        />
        <Stack.Screen name="permissions" options={{ animation: "fade" }} />

        <Stack.Screen
          name="auth/phone-number"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="auth/phone-number-otp"
          options={{ animation: "fade" }}
        />

        <Stack.Screen
          name="user-info/welcome"
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
                          <Button
                            size="$3"
                            themeInverse
                            onPress={() => {
                              void signOut();
                              router.replace("/(onboarding)");
                            }}
                          >
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
        <Stack.Screen
          name="user-info/first-name"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="user-info/date-of-birth"
          options={{ animation: "fade" }}
        />

        <Stack.Screen
          name="user-info/username"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="user-info/profile-picture"
          options={{ animation: "fade" }}
        />
      </Stack>
      <StatusBar />
    </View>
  );
};

export default OnboardingLayout;
