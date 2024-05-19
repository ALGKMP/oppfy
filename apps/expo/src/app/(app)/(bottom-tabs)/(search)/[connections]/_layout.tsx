import { useEffect } from "react";
import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import { Camera, Grid3x3 } from "@tamagui/lucide-icons";

import { TopTabBar } from "~/components/TabBars";
import { TopTabs } from "~/layouts";

const ConnectionsLayout = () => {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  useEffect(() => {
    console.log("ConnectionsLayout", userId);
  }, [userId]);

  return (
    <TopTabs tabBar={(props) => <TopTabBar {...props} />} backBehavior="none">
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
      />
      <TopTabs.Screen
        name="following-list"
        options={{
          title: "Test",
          tabBarLabel: "Following",
        }}
      />
    </TopTabs>
  );
};

export default ConnectionsLayout;
