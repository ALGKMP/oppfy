import React, { useLayoutEffect } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";

import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  const navigation = useNavigation();

  const { userId, username, initialRouteName } = useLocalSearchParams<{
    userId: string;
    username: string;
    initialRouteName: string;
  }>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: username,
    });
  }, [navigation, username]);

  return (
    <TopTabs backBehavior="none" initialRouteName={initialRouteName}>
      <TopTabs.Screen
        name="following"
        options={{
          tabBarLabel: "Following",
        }}
        initialParams={{ userId }}
      />
      <TopTabs.Screen
        name="followers"
        options={{
          tabBarLabel: "Followers",
        }}
        initialParams={{ userId }}
      />
      <TopTabs.Screen
        name="friends"
        options={{
          tabBarLabel: "Friends",
        }}
        initialParams={{ userId }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;
