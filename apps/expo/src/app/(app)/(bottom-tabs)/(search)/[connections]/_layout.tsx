import { useEffect } from "react";
import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  const { userId, initialRouteName } = useLocalSearchParams<{
    userId: string;
    initialRouteName: string;
  }>();

  useEffect(() => {
    console.log("ConnectionsLayout", userId);
  }, [userId]);

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
          title: "Test",
          tabBarLabel: "Followers",
        }}
        initialParams={{ userId }}
      />
      <TopTabs.Screen
        name="following-list"
        options={{
          title: "Test",
          tabBarLabel: "Following",
        }}
        initialParams={{ userId }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;
