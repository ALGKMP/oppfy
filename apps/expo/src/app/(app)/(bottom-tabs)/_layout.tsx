import { useEffect } from "react";
import { Pressable, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, SplashScreen, useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { BottomTabProps } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
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

import { Header } from "~/components/Headers";
import BottomTabsHeader from "~/components/Headers/BottomTabHeader";
import { LoadingIndicatorOverlay } from "~/components/Overlays";
import { TabBar } from "~/components/TabBars";
import { BottomTabs } from "~/layouts";
import { api } from "~/utils/api";

const BottomTabsLayout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        // Paddings to handle safe area
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <BottomTabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          tabBarHideOnKeyboard: true,
          header: ({ navigation, options }) => (
            <Header navigation={navigation} options={options} />
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
                <Pressable onPress={() => router.push("/(app)/(settings)")}>
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
