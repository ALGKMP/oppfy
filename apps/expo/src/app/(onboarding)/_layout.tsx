import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { SplashScreen } from "expo-router";
import Splash from "@assets/splash.png";
import { Info } from "@tamagui/lucide-icons";
import { Image } from "tamagui";

import { Stack } from "~/components/Layouts/Navigation";
import { Icon } from "~/components/ui";

void SplashScreen.hideAsync();

const HeaderTitle = () => (
  <Image source={Splash} resizeMode="contain" width={100} height={100} />
);

const HeaderRight = () => (
  <Icon
    name="information-circle"
    onPress={() => Linking.openURL("https://www.oppfy.app")}
    blurred
  />
);

const OnboardingLayout = () => (
  <Stack
    screenOptions={{
      headerTitle: () => <HeaderTitle />,
      headerRight: () => <HeaderRight />,
    }}
  >
    <Stack.Screen
      name="index"
      options={{
        animation: "fade",
        header: () => null,
      }}
    />

    <Stack.Screen name="misc/permissions" options={{ animation: "fade" }} />

    <Stack.Screen name="auth/phone-number" options={{ animation: "fade" }} />
    <Stack.Screen name="auth/otp" options={{ animation: "fade" }} />

    <Stack.Screen
      name="user-info/name"
      options={{
        animation: "fade",
        gestureEnabled: false,
      }}
    />
    <Stack.Screen name="user-info/username" options={{ animation: "fade" }} />
    <Stack.Screen
      name="user-info/date-of-birth"
      options={{ animation: "fade" }}
    />
    <Stack.Screen
      name="user-info/profile-picture"
      options={{ animation: "fade" }}
    />

    <Stack.Screen
      name="tutorial/intro"
      options={{ animation: "fade", gestureEnabled: false }}
    />
    <Stack.Screen name="tutorial/select-contact" options={{ animation: "fade" }} />
    <Stack.Screen
      name="tutorial/(media-picker)"
      options={{
        headerShown: false,
        presentation: "modal",
        animation: "fade",
      }}
    />
  </Stack>
);

export default OnboardingLayout;
