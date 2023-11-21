import { useEffect } from "react";
import { Pressable } from "react-native";
import { Redirect, SplashScreen, useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { getTokens } from "@tamagui/core";
import {
  Camera,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  User2,
} from "@tamagui/lucide-icons";
import { Button, Text, View, XStack } from "tamagui";

import { api } from "~/utils/api";
import BottomTabsHeader from "~/components/Headers/BottomTabHeader";
import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { BottomTabs } from "~/layouts";

const BottomTabsLayout = () => {
  const router = useRouter();
  const { isLoading, data: user } = api.auth.getUser.useQuery();

  useEffect(() => {
    // When loading is complete, hide the splash screen
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingIndicatorOverlay />;
  }

  if (!user?.firstName || !user?.dateOfBirth) {
    return <Redirect href="/(onboarding)/user-info/welcome" />;
  }

  return (
    <View flex={1} backgroundColor="black">
      <BottomTabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: "black",
            borderTopColor: getTokens().color.gray1Dark.val,
            height: 60,
            paddingTop: 10,
            paddingBottom: 10,
            borderTopWidth: 1,
          },
          header: ({ navigation, options }) => (
            <BottomTabsHeader navigation={navigation} options={options} />
          ),
        }}
      >
        <BottomTabs.Screen
          name="(top-tabs)"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => <Home strokeWidth={focused ? 3 : 2} />,
          }}
        />

        <BottomTabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => (
              <Search strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />

        <BottomTabs.Screen
          name="camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ focused }) => (
              <Camera strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />

        <BottomTabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarIcon: ({ focused }) => (
              <Inbox strokeWidth={focused ? 2 : 1.5} />
            ),
          }}
        />

        <BottomTabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <User2 strokeWidth={focused ? 2 : 1.5} />
            ),
            headerLeft: () => null,
            headerRight: () => (
              <View>
                <Pressable onPress={() => router.push("/(settings)")}>
                  {({ pressed }) => (
                    <MoreHorizontal
                      size="$1"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </View>
            ),
          }}
        />
      </BottomTabs>
    </View>
  );
};

export default BottomTabsLayout;
