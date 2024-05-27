import React, { useLayoutEffect } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTheme } from "tamagui";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  const { userId, username, initialRouteName } = useLocalSearchParams<{
    userId: string;
    username: string;
    initialRouteName: string;
  }>();

  const theme = useTheme();

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
    });
  }, [navigation, username]);

  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      backBehavior="none"
      initialRouteName={initialRouteName}
      screenOptions={{
        lazy: true,
      }}
      sceneContainerStyle={{
        backgroundColor: theme.background.val,
      }}
    >
      <TopTabs.Screen
        name="friend-list"
        options={{
          tabBarLabel: "Friends",
        }}
        initialParams={{ userId }}
      />
      <TopTabs.Screen
        name="follower-list"
        options={{
          tabBarLabel: "Followers",
        }}
        initialParams={{ userId }}
      />
      <TopTabs.Screen
        name="following-list"
        options={{
          tabBarLabel: "Following",
        }}
        initialParams={{ userId }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;
