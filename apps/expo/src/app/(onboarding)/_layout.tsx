import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import Splash from "@assets/splash.png";
import { Info } from "@tamagui/lucide-icons";
import { Image } from "tamagui";

import { Stack } from "~/components/Layouts/Navigation";
import { Icon } from "~/components/ui";

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

    <Stack.Screen name="firebaseauth/link" options={{ animation: "fade" }} />
    <Stack.Screen
      name="firebaseauth/phone-number-otp"
      options={{ animation: "fade" }}
    />

    <Stack.Screen
      name="review-pending-posts"
      options={{
        animation: "fade",
        gestureEnabled: false,
      }}
    />

    <Stack.Screen
      name="user-info/welcome"
      options={{
        animation: "fade",
        gestureEnabled: false,
      }}
    />
    <Stack.Screen name="user-info/name" options={{ animation: "fade" }} />
    <Stack.Screen
      name="user-info/date-of-birth"
      options={{ animation: "fade" }}
    />

    <Stack.Screen name="user-info/username" options={{ animation: "fade" }} />
    <Stack.Screen
      name="user-info/profile-picture"
      options={{ animation: "fade" }}
    />
  </Stack>
);

export default OnboardingLayout;
