import React, { useLayoutEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  const { userId, username, initialRouteName } = useLocalSearchParams<{
    userId: string;
    initialRouteName: string;
  }>();

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
    });
  }, [navigation, initialRouteName]);

  return (
    <TopTabs
      tabBar={(props) => <TopTabBar {...props} />}
      backBehavior="none"
      initialRouteName={initialRouteName}
    >
      <TopTabs.Screen
        name="friends-list"
        options={{
          tabBarLabel: "Friends",
        }}
        initialParams={{ userId }}
      />
      <TopTabs.Screen
        name="followers-list"
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
